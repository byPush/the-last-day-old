import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Message } from '@farcaster/core';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const publicClient = createPublicClient({
  chain: base,
  transport: http()
});

// Validate Farcaster message
async function validateMessage(message) {
  try {
    const isValid = await Message.verify(message);
    return isValid;
  } catch (error) {
    console.error('Error validating message:', error);
    return false;
  }
}

app.post('/vote', async (req, res) => {
  try {
    const { untrustedData, trustedData } = req.body;
    
    // Basic validation
    if (!untrustedData?.fid || !trustedData?.messageBytes?.buttonIndex) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        next: {
          image: 'https://i.ibb.co/1GLRtJRX/1000-def.jpg'
        }
      });
    }

    const { fid } = untrustedData;
    const { buttonIndex } = trustedData.messageBytes;
    const inputText = untrustedData.inputText || '';

    // Check if user has already voted this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: existingVote } = await supabase
      .from('votes')
      .select()
      .eq('fid', fid)
      .gte('created_at', oneWeekAgo.toISOString())
      .single();

    if (existingVote) {
      return res.status(400).json({
        error: 'Already voted this week',
        next: {
          image: 'https://i.ibb.co/1GLRtJRX/1000-def.jpg'
        }
      });
    }

    // Record the vote
    const { error: voteError } = await supabase
      .from('votes')
      .insert([
        {
          fid,
          artwork_id: buttonIndex,
          comment: inputText,
          created_at: new Date().toISOString()
        }
      ]);

    if (voteError) {
      throw voteError;
    }

    // Return success with the next frame
    return res.json({
      next: {
        image: 'https://i.ibb.co/1GLRtJRX/1000-def.jpg',
        text: 'Vote recorded! Thank you for participating.'
      }
    });
  } catch (error) {
    console.error('Error processing vote:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      next: {
        image: 'https://i.ibb.co/1GLRtJRX/1000-def.jpg'
      }
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});