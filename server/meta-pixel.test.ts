import { describe, it, expect } from 'vitest';

describe('Meta Pixel Configuration', () => {
  it('should have META_PIXEL_ID configured', () => {
    const pixelId = process.env.META_PIXEL_ID;
    expect(pixelId).toBeDefined();
    expect(pixelId).toBe('898343203142628');
    expect(pixelId?.length).toBeGreaterThan(10);
  });

  it('should have META_ACCESS_TOKEN configured', () => {
    const accessToken = process.env.META_ACCESS_TOKEN;
    expect(accessToken).toBeDefined();
    expect(accessToken?.length).toBeGreaterThan(50);
    // Token should start with EAA (Facebook App Access Token format)
    expect(accessToken?.startsWith('EAC') || accessToken?.startsWith('EAA')).toBe(true);
  });

  it('should be able to call Meta Conversions API', async () => {
    const pixelId = process.env.META_PIXEL_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;
    
    if (!pixelId || !accessToken) {
      console.log('Skipping API test - credentials not configured');
      return;
    }

    // Send a test event to verify the connection
    const testEvent = {
      data: [{
        event_name: 'TestEvent',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        user_data: {
          client_ip_address: '127.0.0.1',
          client_user_agent: 'vitest/1.0',
        },
      }],
      test_event_code: 'TEST12345', // This marks it as a test event
    };

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testEvent),
      }
    );

    const result = await response.json();
    console.log('Meta API Response:', result);
    
    // The API should return a response (even if the event is filtered as test)
    expect(response.status).toBeLessThan(500); // Not a server error
    
    // If we get a 200, check for events_received
    if (response.ok) {
      expect(result.events_received).toBeDefined();
    }
  });
});
