import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isSubscriptionActive, isTrialExpired } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const widgetKey = searchParams.get('key') || searchParams.get('widgetKey')

    if (!widgetKey) {
      return NextResponse.json(
        { error: 'Widget key is required' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Find widget by public key with tenant subscription info
    const widget = await prisma.widget.findFirst({
      where: {
        publicKey: widgetKey,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        greetingText: true,
        primaryColor: true,
        position: true,
        bubbleText: true,
        agentName: true,
        companyName: true,
        tenantId: true,
        tenant: {
          select: {
            subscriptionStatus: true,
            trialEndsAt: true,
          }
        }
      }
    })

    if (!widget) {
      return NextResponse.json(
        { error: 'Widget not found or inactive' },
        {
          status: 404,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    // Check subscription status
    const subscriptionActive = isSubscriptionActive(widget.tenant.subscriptionStatus)
    const trialExpired = isTrialExpired(widget.tenant.trialEndsAt, widget.tenant.subscriptionStatus)

    // If subscription is not active and trial is expired, return service paused
    if (!subscriptionActive && trialExpired) {
      return NextResponse.json(
        {
          success: false,
          servicePaused: true,
          message: 'This chat service is temporarily unavailable. Please contact the site owner.'
        },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      )
    }

    // Return configuration optimized for client-side usage
    const config = {
      id: widget.id,
      name: widget.name,
      greetingText: widget.greetingText,
      primaryColor: widget.primaryColor,
      position: widget.position,
      bubbleText: widget.bubbleText,
      agentName: widget.agentName || 'AI Assistant',
      companyName: widget.companyName || '',
      tenantId: widget.tenantId, // Needed for conversation association
    }

    return NextResponse.json(
      { success: true, config },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
        }
      }
    )
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Widget config fetch error:', error)
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch widget configuration' },
      { 
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    )
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  )
}