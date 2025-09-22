import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv.default({ allErrors: true });
addFormats.default(ajv);

// Log validation schema
const logSchema = {
  type: 'object',
  properties: {
    orgId: { type: 'string', maxLength: 100 },
    service: { type: 'string', minLength: 1, maxLength: 100 },
    level: { 
      type: 'string', 
      enum: ['INFO', 'WARN', 'ERROR', 'DEBUG'] 
    },
    timestamp: { 
      type: 'string', 
      format: 'date-time' 
    },
    message: { type: 'string', maxLength: 1000 },
    latencyMs: { type: 'integer', minimum: 0, maximum: 60000 },
    responseCode: { type: 'integer', minimum: 100, maximum: 599 },
    metadata: { 
      type: 'object',
      additionalProperties: true 
    }
  },
  required: ['service', 'level', 'timestamp'],
  additionalProperties: false
};

// Batch validation schema
const batchLogSchema = {
  type: 'array',
  items: logSchema,
  maxItems: 1000, // Prevent too large batches
  minItems: 1
};

export const validateLog = ajv.compile(logSchema);
export const validateBatchLogs = ajv.compile(batchLogSchema);

export function formatValidationErrors(errors: any[]): string {
  return errors
    .map(err => `${err.instancePath || 'root'}: ${err.message}`)
    .join(', ');
}
