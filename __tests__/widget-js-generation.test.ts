/**
 * FAANG-Level Widget.js Generation Test Suite
 * 
 * Comprehensive testing for the dynamic JavaScript widget generation
 * Tests inspired by Meta's component testing and Google's code quality standards
 */

import { GET } from '@/app/widget.js/route'
import { NextRequest } from 'next/server'

// Mock Next.js environment for testing
global.Headers = global.Headers || class Headers {
  private headers: Record<string, string> = {}
  
  set(name: string, value: string) {
    this.headers[name.toLowerCase()] = value
  }
  
  get(name: string): string | null {
    return this.headers[name.toLowerCase()] || null
  }
  
  has(name: string): boolean {
    return name.toLowerCase() in this.headers
  }
  
  delete(name: string) {
    delete this.headers[name.toLowerCase()]
  }
  
  forEach(callback: (value: string, key: string) => void) {
    Object.entries(this.headers).forEach(([key, value]) => callback(value, key))
  }
  
  entries() {
    return Object.entries(this.headers)[Symbol.iterator]()
  }
  
  keys() {
    return Object.keys(this.headers)[Symbol.iterator]()
  }
  
  values() {
    return Object.values(this.headers)[Symbol.iterator]()
  }
}

describe('Widget.js Generation - FAANG Quality Tests', () => {
  describe('JavaScript Code Generation', () => {
    it('should generate valid JavaScript without syntax errors', async () => {
      const response = await GET()
      const widgetJs = await response.text()
      
      // Validate basic JavaScript structure
      expect(widgetJs).toContain('(function() {')
      expect(widgetJs).toContain('})();')
      
      // Ensure no syntax errors in generated code
      expect(() => {
        new Function(widgetJs)
      }).not.toThrow()
    })

    it('should contain all required widget functionality', async () => {
      const response = await GET()
      const widgetJs = await response.text()
      
      // Core functions that must be present
      const requiredFunctions = [
        'generateSessionId',
        'trackEvent', 
        'ensureWidgetContainer',
        'createWidget',
        'loadConfig',
        'startConversation',
        'openChat',
        'closeChat',
        'sendMessage',
        'processMessageForLead',
        'addMessage'
      ]
      
      requiredFunctions.forEach(func => {
        expect(widgetJs).toMatch(new RegExp(`function\\s+${func}\\s*\\(`))
      })
    })

    it('should properly escape template literals and variables', async () => {
      const response = await GET()
      const widgetJs = await response.text()
      
      // Should NOT contain double-escaped template literals
      expect(widgetJs).not.toContain('\\\\`')
      expect(widgetJs).not.toContain('\\\\$')
      
      // Should contain proper template literal syntax
      expect(widgetJs).toMatch(/`[^`]*\$\{[^}]+\}[^`]*`/)
      
      // Critical: Validate fetch calls are properly formatted
      expect(widgetJs).toMatch(/fetch\s*\(\s*`[^`]+\/api\/[^`]+`/)
    })

    it('should generate proper API endpoint calls', async () => {
      const response = await GET()
      const widgetJs = await response.text()
      
      // Should contain all expected API calls
      const expectedEndpoints = [
        '/api/analytics/events',
        '/api/widget-config', 
        '/api/conversations',
        '/api/messages'
      ]
      
      expectedEndpoints.forEach(endpoint => {
        expect(widgetJs).toContain(endpoint)
      })
      
      // Validate fetch calls are properly structured
      const fetchPattern = /fetch\s*\(\s*`[^`]*\/api\/[^`]+`\s*,\s*\{/g
      const fetchMatches = widgetJs.match(fetchPattern)
      expect(fetchMatches).toBeTruthy()
      expect(fetchMatches!.length).toBeGreaterThan(0)
    })

    it('should contain proper CSS-in-JS styling', async () => {
      const response = await GET()
      const widgetJs = await response.text()
      
      // Should contain inline styles
      expect(widgetJs).toContain('style.cssText')
      expect(widgetJs).toContain('position: fixed')
      expect(widgetJs).toContain('z-index:')
      
      // Should support widget positioning
      expect(widgetJs).toContain('bottom-right')
      expect(widgetJs).toContain('widgetConfig?.position')
      
      // Should support theming
      expect(widgetJs).toContain('widgetConfig?.primaryColor')
    })

    it('should implement comprehensive error handling', async () => {
      const response = await GET()
      const widgetJs = await response.text()
      
      // Should have try-catch blocks
      expect(widgetJs).toMatch(/try\s*\{[\s\S]*?\}\s*catch\s*\(/g)
      
      // Should handle fetch errors gracefully
      expect(widgetJs).toContain('catch(error')
      expect(widgetJs).toContain('console.error')
      expect(widgetJs).toContain('console.debug')
      
      // Should fail silently for analytics
      expect(widgetJs).toContain('Silently fail analytics')
    })

    it('should support conversation state management', async () => {
      const response = await GET()
      const widgetJs = await response.text()
      
      // Should manage conversation state
      expect(widgetJs).toContain('conversationState')
      expect(widgetJs).toContain('hasGreeted')
      expect(widgetJs).toContain('hasName')
      expect(widgetJs).toContain('hasEmail')
      expect(widgetJs).toContain('hasIntent')
      
      // Should track visitor information
      expect(widgetJs).toContain('visitorName')
      expect(widgetJs).toContain('visitorEmail')
      expect(widgetJs).toContain('visitorIntent')
    })

    it('should implement lead qualification logic', async () => {
      const response = await GET()
      const widgetJs = await response.text()
      
      // Should process messages for leads
      expect(widgetJs).toContain('processMessageForLead')
      
      // Should detect intents
      const intents = ['buying', 'selling', 'renting', 'investing']
      intents.forEach(intent => {
        expect(widgetJs).toContain(intent)
      })
      
      // Should extract email patterns
      expect(widgetJs).toMatch(/email.*match.*@/i)
      
      // Should extract name patterns
      expect(widgetJs).toContain("i'm ")
      expect(widgetJs).toContain("my name is")
    })

    it('should handle DOM manipulation safely', async () => {
      const response = await GET()
      const widgetJs = await response.text()
      
      // Should check for existing elements
      expect(widgetJs).toContain('getElementById')
      expect(widgetJs).toContain('createElement')
      expect(widgetJs).toContain('appendChild')
      
      // Should handle container creation
      expect(widgetJs).toContain('ensureWidgetContainer')
      expect(widgetJs).toContain('realestate-ai-widget')
      
      // Should handle event listeners
      expect(widgetJs).toContain('addEventListener')
      expect(widgetJs).toContain('click')
      expect(widgetJs).toContain('keypress')
    })

    it('should support analytics tracking', async () => {
      const response = await GET()
      const widgetJs = await response.text()
      
      // Should track key events
      const trackedEvents = [
        'widget_view',
        'conversation_started'
      ]
      
      trackedEvents.forEach(event => {
        expect(widgetJs).toContain(event)
      })
      
      // Should send analytics data
      expect(widgetJs).toContain('sessionId')
      expect(widgetJs).toContain('userAgent')
      expect(widgetJs).toContain('referrer')
    })

    it('should be responsive and configurable', async () => {
      const response = await GET()
      const widgetJs = await response.text()
      
      // Should support configuration
      expect(widgetJs).toContain('widgetConfig')
      expect(widgetJs).toContain('bubbleText')
      expect(widgetJs).toContain('agentName')
      expect(widgetJs).toContain('companyName')
      expect(widgetJs).toContain('greetingText')
      
      // Should handle different positions
      expect(widgetJs).toContain('position.split')
      expect(widgetJs).toContain('vPos')
      expect(widgetJs).toContain('hPos')
    })
  })

  describe('Response Headers and Caching', () => {
    it('should return JavaScript content type', async () => {
      const response = await GET()
      
      expect(response.headers.get('Content-Type')).toBe('application/javascript')
    })

    it('should set appropriate cache headers', async () => {
      const response = await GET()
      
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600')
    })
  })

  describe('Code Quality and Security', () => {
    it('should not contain obvious security vulnerabilities', async () => {
      const response = await GET()
      const widgetJs = await response.text()
      
      // Should not contain eval or similar dangerous functions
      expect(widgetJs).not.toContain('eval(')
      expect(widgetJs).not.toContain('Function(')
      
      // Should validate inputs
      expect(widgetJs).toContain('trim()')
      expect(widgetJs).toContain('if (!message')
      
      // Should handle missing configuration gracefully
      expect(widgetJs).toContain('widgetConfig?.')
    })

    it('should follow consistent code formatting', async () => {
      const response = await GET()
      const widgetJs = await response.text()
      
      // Should have consistent indentation (spaces or tabs)
      const lines = widgetJs.split('\n')
      const indentedLines = lines.filter(line => line.match(/^\s+\S/))
      
      // Most lines should follow consistent indentation
      expect(indentedLines.length).toBeGreaterThan(50)
      
      // Should not have mixed indentation in critical sections
      expect(widgetJs).not.toMatch(/^\s*\t\s+\S/m)
    })

    it('should handle browser compatibility', async () => {
      const response = await GET()
      const widgetJs = await response.text()
      
      // Should use compatible DOM methods
      expect(widgetJs).toContain('document.createElement')
      expect(widgetJs).toContain('document.getElementById')
      
      // Should handle script loading states
      expect(widgetJs).toContain('document.readyState')
      expect(widgetJs).toContain('DOMContentLoaded')
      
      // Should use fallbacks
      expect(widgetJs).toContain('document.currentScript')
      expect(widgetJs).toContain('querySelector')
    })
  })

  describe('Performance and Optimization', () => {
    it('should minimize DOM queries', async () => {
      const response = await GET()
      const widgetJs = await response.text()
      
      // Should cache DOM elements
      const getByIdCalls = (widgetJs.match(/getElementById\(/g) || []).length
      
      // Should not have excessive DOM queries
      expect(getByIdCalls).toBeLessThan(20)
      
      // Should reuse elements where possible
      expect(widgetJs).toContain('widgetContainer')
    })

    it('should handle memory management', async () => {
      const response = await GET()
      const widgetJs = await response.text()
      
      // Should not create excessive global variables
      const globalVars = (widgetJs.match(/var\s+\w+\s*=/g) || []).length
      expect(globalVars).toBeLessThan(5)
      
      // Should use IIFE to avoid global scope pollution
      expect(widgetJs).toMatch(/^\s*\(function\(\)\s*\{/)
    })
  })

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle missing widget key gracefully', async () => {
      const response = await GET()
      const widgetJs = await response.text()
      
      expect(widgetJs).toContain('if (!widgetKey)')
      expect(widgetJs).toContain('console.error')
      expect(widgetJs).toContain('Widget key not found')
    })

    it('should handle network failures gracefully', async () => {
      const response = await GET()
      const widgetJs = await response.text()
      
      // Should handle fetch failures
      expect(widgetJs).toContain('catch(error')
      expect(widgetJs).toContain('Failed to load')
      expect(widgetJs).toContain('Failed to send')
      
      // Should provide fallback messages
      expect(widgetJs).toContain('trouble processing')
    })

    it('should validate configuration data', async () => {
      const response = await GET()
      const widgetJs = await response.text()
      
      // Should check configuration validity
      expect(widgetJs).toContain('data.success')
      expect(widgetJs).toContain('data.config')
      
      // Should provide defaults
      expect(widgetJs).toContain('|| \'')
      expect(widgetJs).toContain('widgetConfig?.agentName || \'AI Assistant\'')
    })
  })
})