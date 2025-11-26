import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { enqueueNewLeadNotification } from '@/lib/notifications'

interface ConversationState {
  hasName?: boolean
  hasEmail?: boolean
  hasIntent?: boolean
  visitorName?: string
  visitorEmail?: string
  visitorIntent?: string
}

interface Message {
  id: string
  text: string
  senderType: string
  createdAt: Date
}

interface ContactInfo {
  name?: string
  email?: string
  hasContact: boolean
}


// Intelligent conversation flow - guides visitors through lead qualification
function generateAIResponse(message: string, conversationHistory: Message[] = [], conversationState?: ConversationState): { response: string, updatedState?: ConversationState } {
  const lowerMessage = message.toLowerCase()
  const messageCount = conversationHistory.length
  const updatedState = { ...conversationState }
  
  // First-time visitor greeting and name collection
  if (messageCount <= 2 && !updatedState.hasName) {
    if (lowerMessage.includes("i'm ") || lowerMessage.includes("my name is") || lowerMessage.includes("im ")) {
      const nameMatch = message.match(/(?:i'm|my name is|im)\s+([a-zA-Z]+)/i);
      if (nameMatch) {
        updatedState.visitorName = nameMatch[1];
        updatedState.hasName = true;
        return {
          response: `Nice to meet you, ${nameMatch[1]}! What brings you here today? Are you looking to buy, sell, or rent a property?`,
          updatedState
        };
      }
    }
    // Prompt for name if not provided
    return {
      response: "Thanks for reaching out! I'd love to help you. What's your name?",
      updatedState
    };
  }
  
  // Intent collection after name
  if (updatedState.hasName && !updatedState.hasIntent) {
    if (lowerMessage.includes('buy') || lowerMessage.includes('purchase')) {
      updatedState.visitorIntent = 'buying';
      updatedState.hasIntent = true;
      return {
        response: `Great! I'd be happy to help you find the perfect property to buy, ${updatedState.visitorName || 'there'}. What's your budget range and preferred location?`,
        updatedState
      };
    } else if (lowerMessage.includes('sell') || lowerMessage.includes('selling')) {
      updatedState.visitorIntent = 'selling';
      updatedState.hasIntent = true;
      return {
        response: `Excellent! I can help you sell your property, ${updatedState.visitorName || 'there'}. What type of property are you looking to sell, and where is it located?`,
        updatedState
      };
    } else if (lowerMessage.includes('rent') || lowerMessage.includes('rental')) {
      updatedState.visitorIntent = 'renting';
      updatedState.hasIntent = true;
      return {
        response: `Perfect! Are you looking to rent out a property you own, or are you searching for a place to rent, ${updatedState.visitorName || 'there'}?`,
        updatedState
      };
    } else if (lowerMessage.includes('invest') || lowerMessage.includes('investment')) {
      updatedState.visitorIntent = 'investing';
      updatedState.hasIntent = true;
      return {
        response: `Fantastic! Investment properties can be very rewarding, ${updatedState.visitorName || 'there'}. Are you looking for rental income properties or properties to flip?`,
        updatedState
      };
    }
    
    return {
      response: `I'd love to help you, ${updatedState.visitorName || 'there'}! Are you looking to buy, sell, rent, or invest in real estate?`,
      updatedState
    };
  }
  
  // Email collection after intent
  if (updatedState.hasName && updatedState.hasIntent && !updatedState.hasEmail) {
    const emailMatch = message.match(/\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b/);
    if (emailMatch) {
      updatedState.visitorEmail = emailMatch[0];
      updatedState.hasEmail = true;
      return {
        response: `Perfect! I have your email as ${emailMatch[0]}. I'll send you some great options and market insights. What's your preferred timeline for ${updatedState.visitorIntent}?`,
        updatedState
      };
    }
    
    return {
      response: `That sounds like a great plan! To provide you with the most relevant properties and market information, could you share your email address?`,
      updatedState
    };
  }
  
  // Qualified conversation - provide helpful responses
  if (updatedState.hasName && updatedState.hasIntent && updatedState.hasEmail) {
    // Property-specific responses
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('budget')) {
      return {
        response: `Property prices vary significantly by location and type, ${updatedState.visitorName}. I'll send you a detailed market report with current pricing for your area. Our agent will also reach out within 24 hours to discuss your specific budget and requirements.`,
        updatedState
      };
    }
    
    if (lowerMessage.includes('location') || lowerMessage.includes('area') || lowerMessage.includes('neighborhood')) {
      return {
        response: `Location is absolutely crucial! I'll compile a list of the best neighborhoods that match your criteria and budget. Our local market expert will contact you soon to schedule a personalized tour.`,
        updatedState
      };
    }
    
    if (lowerMessage.includes('timeline') || lowerMessage.includes('when') || lowerMessage.includes('time')) {
      return {
        response: `Understanding your timeline helps us prioritize the right opportunities for you, ${updatedState.visitorName}. I'll make sure our agent reaches out today to discuss your schedule and get the process started.`,
        updatedState
      };
    }
    
    // Default qualified response
    return {
      response: `That's a great question, ${updatedState.visitorName}! I've captured your details and our experienced agent will reach out within 24 hours to provide personalized assistance with your ${updatedState.visitorIntent} goals. Is there anything specific you'd like me to note for them?`,
      updatedState
    };
  }
  
  // Fallback responses for unqualified visitors  
  const defaultResponses = [
    "That's interesting! I'd love to help you with your real estate needs. What's your name?",
    "I understand. To provide the best assistance, could you tell me your name and whether you're looking to buy, sell, or rent?", 
    "Great question! I'm here to help. What's your name, and what brings you to our site today?",
    "I'd love to assist you with that. Could you share your name and let me know if you're interested in buying, selling, or renting?"
  ];
  
  return {
    response: defaultResponses[Math.floor(Math.random() * defaultResponses.length)],
    updatedState
  };
}

// Enhanced lead qualification based on conversation state
function extractLeadInfo(messages: Message[], conversationState?: ConversationState): { intent?: string, qualificationScore: number, contactInfo?: ContactInfo } {
  const intent = conversationState?.visitorIntent || 'General Inquiry'
  let score = 25 // Base score
  
  const allMessages = messages.map(m => m.text.toLowerCase()).join(' ')
  
  // Intent scoring
  if (conversationState?.hasIntent) {
    switch (conversationState.visitorIntent) {
      case 'buying':
      case 'selling':
        score += 30
        break
      case 'investing':
        score += 35
        break
      case 'renting':
        score += 25
        break
    }
  }
  
  // Contact information scoring
  if (conversationState?.hasName) score += 20
  if (conversationState?.hasEmail) score += 30
  
  // Engagement level scoring
  const messageCount = messages.length
  if (messageCount >= 3) score += 10
  if (messageCount >= 5) score += 10
  if (messageCount >= 8) score += 5
  
  // Content analysis scoring
  if (allMessages.includes('budget') || allMessages.includes('price') || allMessages.includes('cost')) score += 10
  if (allMessages.includes('timeline') || allMessages.includes('when') || allMessages.includes('soon')) score += 10
  if (allMessages.includes('location') || allMessages.includes('area') || allMessages.includes('neighborhood')) score += 5
  if (allMessages.includes('mortgage') || allMessages.includes('financing') || allMessages.includes('loan')) score += 10
  
  // Qualification bonus for complete information
  if (conversationState?.hasName && conversationState?.hasEmail && conversationState?.hasIntent) {
    score += 15
  }
  
  const contactInfo = {
    name: conversationState?.visitorName,
    email: conversationState?.visitorEmail,
    hasContact: conversationState?.hasEmail || false
  }
  
  return { 
    intent: intent.charAt(0).toUpperCase() + intent.slice(1), 
    qualificationScore: Math.min(score, 100),
    contactInfo
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversationId, message, senderType, conversationState } = body

    // Verify conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { 
        widget: true,
        lead: true,
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Create visitor message
    await prisma.message.create({
      data: {
        conversationId,
        text: message,
        senderType,
      },
    })

    // Generate AI response for visitor messages
    let aiResponse = null
    let updatedState = null
    if (senderType === 'VISITOR') {
      const aiResult = generateAIResponse(message, conversation.messages, conversationState)
      const responseText = aiResult.response
      updatedState = aiResult.updatedState
      
      // Create AI response message
      await prisma.message.create({
        data: {
          conversationId,
          text: responseText,
          senderType: 'SYSTEM',
        },
      })
      
      aiResponse = responseText
    }

    // Update or create lead if this is a visitor message
    if (senderType === 'VISITOR') {
      // Get updated conversation with all messages
      const updatedConversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { 
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      })

      const { intent, qualificationScore } = extractLeadInfo(updatedConversation!.messages, updatedState)

      if (conversation.lead) {
        // Update existing lead
        await prisma.lead.update({
          where: { id: conversation.lead.id },
          data: {
            intent,
            qualificationScore,
            updatedAt: new Date(),
          }
        })
      } else {
        // Create new lead
        const newLead = await prisma.lead.create({
          data: {
            tenantId: conversation.tenantId,
            widgetId: conversation.widgetId,
            intent,
            qualificationScore,
          }
        })

        // Track lead creation event
        await prisma.widgetEvent.create({
          data: {
            eventType: 'lead_created',
            tenantId: conversation.tenantId,
            widgetId: conversation.widgetId,
          }
        })

        // Link conversation to lead
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { leadId: newLead.id }
        })

        // Trigger notification for new lead
        enqueueNewLeadNotification(newLead.id, conversation.tenantId)
      }
    }

    return NextResponse.json({ 
      success: true,
      response: aiResponse,
      updatedState: updatedState
    })
  } catch (error) {
    // Log error securely in production environment
    if (process.env.NODE_ENV === 'development') {
      console.error('Message creation error:', error)
    }
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}