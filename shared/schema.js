import { z } from 'zod';

export const CROPS = ['Tomatoes', 'Almonds', 'Grapes', 'Citrus', 'Pistachios', 'Walnuts', 'Peaches', 'Lettuce', 'Corn', 'Alfalfa', 'Other'];
export const SOILS = ['Sandy loam', 'Loam', 'Clay loam', 'Sandy', 'Clay', 'Silt loam', 'Not sure'];
export const IRRIGATION = ['Drip irrigation', 'Micro-sprinklers', 'Sprinklers', 'Furrow irrigation', 'Flood irrigation', 'Hand watering', 'Rain-fed'];
export const STAGES = ['Seedling / establishment', 'Vegetative growth', 'Flowering', 'Fruit development', 'Harvest', 'Post-harvest / dormant', 'Not sure'];
export const FieldSchema = z.object({
  name: z.string().trim().min(2).max(80),
  crop: z.enum(CROPS),
  customCrop: z.string().trim().max(80).optional(),
  soil: z.enum(SOILS),
  irrigation: z.enum(IRRIGATION),
  stage: z.enum(STAGES),
  acres: z.number().positive().max(10000),
  address: z.string().trim().max(200),
  latitude: z.number().min(32).max(42.1).optional(),
  longitude: z.number().min(-124.6).max(-114).optional(),
}).refine(field => (field.latitude === undefined) === (field.longitude === undefined)
  && (field.address.length >= 2 || field.latitude !== undefined), {
  message: 'Enter a California address or both latitude and longitude.',
}).refine(field => field.crop !== 'Other' || (field.customCrop?.trim().length >= 2), {
  message: 'Enter the crop name when Other is selected.', path: ['customCrop'],
});
export const LocationSchema = z.object({
  name: z.string().max(250),
  latitude: z.number().min(32).max(42.1),
  longitude: z.number().min(-124.6).max(-114),
  precision: z.enum(['address', 'city', 'coordinates']),
});
export const AnalyzeSchema = z.object({
  field: FieldSchema,
  quality: z.enum(['Looking healthy', 'Some concerns', 'Needs attention', 'Severe decline']),
  language: z.enum(['en', 'es']).default('en'),
  concerns: z.string().trim().min(10).max(2000),
  photos: z.array(z.object({
    mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
    data: z.string().min(40).max(1500000).regex(/^[A-Za-z0-9+/]+={0,2}$/),
  })).min(1).max(3),
  location: LocationSchema.nullable(),
  turnstileToken: z.string().max(3000).optional(),
});
const sentence = z.string().min(1).max(1600);
export const ReportSchema = z.object({
  headline: z.string().min(1).max(120),
  summary: sentence,
  imageQuality: z.enum(['clear', 'limited', 'unusable']),
  imageNotes: sentence,
  overallStatus: z.enum(['monitor', 'attention', 'urgent', 'insufficient_evidence']),
  observations: z.array(sentence).min(1).max(6),
  issues: z.array(z.object({
    title: z.string().min(1).max(100),
    confidence: z.enum(['low', 'moderate', 'high']),
    severity: z.enum(['low', 'moderate', 'high']),
    evidence: sentence,
    alternatives: sentence,
    verification: sentence,
  })).max(5),
  recommendations: z.array(z.object({
    title: z.string().min(1).max(100),
    priority: z.enum(['today', 'this_week', 'monitor']),
    action: sentence,
    why: sentence,
    category: z.enum(['water', 'soil', 'crop', 'inspection']),
  })).min(2).max(6),
  timeline: z.array(z.object({
    when: z.string().min(1).max(60),
    title: z.string().min(1).max(100),
    action: sentence,
    checkpoint: sentence,
  })).min(3).max(5),
  irrigationAdvice: sentence,
  limitations: z.array(sentence).min(1).max(5),
});

export function isValidImage(photo) {
  const bytes = Buffer.from(photo.data, 'base64');
  if (bytes.length < 32 || bytes.length > 1100000) return false;
  if (photo.mimeType === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (photo.mimeType === 'image/png') return bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  return bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
}
