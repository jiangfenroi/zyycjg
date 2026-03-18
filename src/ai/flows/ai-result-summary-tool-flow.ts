'use server';
/**
 * @fileOverview An AI agent to summarize important abnormal results.
 *
 * - summarizeAbnormalResult - A function that handles the summarization process.
 * - AbnormalResultDetailsInput - The input type for the summarizeAbnormalResult function.
 * - AbnormalResultSummaryOutput - The return type for the summarizeAbnormalResult function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AbnormalResultDetailsInputSchema = z
  .string()
  .describe('The detailed text of the important abnormal result.');
export type AbnormalResultDetailsInput = z.infer<
  typeof AbnormalResultDetailsInputSchema
>;

const AbnormalResultSummaryOutputSchema = z
  .string()
  .describe('A concise summary of the important abnormal result.');
export type AbnormalResultSummaryOutput = z.infer<
  typeof AbnormalResultSummaryOutputSchema
>;

export async function summarizeAbnormalResult(
  details: AbnormalResultDetailsInput
): Promise<AbnormalResultSummaryOutput> {
  return aiResultSummaryToolFlow(details);
}

const summarizeAbnormalResultPrompt = ai.definePrompt({
  name: 'summarizeAbnormalResultPrompt',
  input: {schema: AbnormalResultDetailsInputSchema},
  output: {schema: AbnormalResultSummaryOutputSchema},
  prompt: `You are an expert medical summarizer. Your task is to provide a concise, clear, and professional summary of the following detailed medical result. Focus on the most critical information and potential implications.

Detailed Result: """{{{this}}}"""

Concise Summary:`,
});

const aiResultSummaryToolFlow = ai.defineFlow(
  {
    name: 'aiResultSummaryToolFlow',
    inputSchema: AbnormalResultDetailsInputSchema,
    outputSchema: AbnormalResultSummaryOutputSchema,
  },
  async input => {
    const {output} = await summarizeAbnormalResultPrompt(input);
    return output!;
  }
);
