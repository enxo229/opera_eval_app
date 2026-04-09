import { logs, SeverityNumber } from '@opentelemetry/api-logs';
import { trace, context } from '@opentelemetry/api';

/**
 * CoE Logging Utility
 * Proporciona métodos de logueo estandarizados con filtrado dinámico.
 */

const OTEL_LOG_INFO_ENABLED = process.env.OTEL_LOG_INFO_ENABLED === 'true';
const OTEL_LOG_DEBUG_ENABLED = process.env.OTEL_LOG_DEBUG_ENABLED === 'true';

type LogAttributes = Record<string, any>;

function emit(level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR', message: string, error?: Error, attributes: LogAttributes = {}) {
    // 1. Filtrado dinámico solicitado por el usuario
    if (level === 'DEBUG' && !OTEL_LOG_DEBUG_ENABLED) return;
    if (level === 'INFO' && !OTEL_LOG_INFO_ENABLED) return;

    const logger = logs.getLogger('coe-app-logger');
    
    // 2. Obtener contexto de correlación (TraceID / SpanID)
    const currentSpan = trace.getSpan(context.active());
    const spanContext = currentSpan?.spanContext();
    
    const coeAttributes: LogAttributes = {
        ...attributes,
        // Correlación explícita para Loki/Grafana según CoE
        'trace.id': spanContext?.traceId,
        'span.id': spanContext?.spanId,
    };

    // 3. Manejo de Errores según CoE
    if (error) {
        coeAttributes['error.message'] = error.message;
        coeAttributes['error.stack'] = error.stack;
    }

    // 4. Mapeo de Severidad
    let severityNumber = SeverityNumber.INFO;
    if (level === 'DEBUG') severityNumber = SeverityNumber.DEBUG;
    if (level === 'WARN') severityNumber = SeverityNumber.WARN;
    if (level === 'ERROR') severityNumber = SeverityNumber.ERROR;

    logger.emit({
        severityNumber,
        severityText: level,
        body: message,
        attributes: coeAttributes,
        timestamp: new Date()
    });

    // También enviamos a console para logs locales/plataforma (Vercel Drains)
    const consoleMethod = level.toLowerCase() as 'debug' | 'info' | 'warn' | 'error';
    if (typeof console[consoleMethod] === 'function') {
        console[consoleMethod](JSON.stringify({
            timestamp: new Date().toISOString(),
            level,
            message,
            ...coeAttributes
        }));
    }
}

export const log = {
    debug: (msg: string, attr?: LogAttributes) => emit('DEBUG', msg, undefined, attr),
    info: (msg: string, attr?: LogAttributes) => emit('INFO', msg, undefined, attr),
    warn: (msg: string, attr?: LogAttributes) => emit('WARN', msg, undefined, attr),
    error: (msg: string, err?: Error, attr?: LogAttributes) => emit('ERROR', msg, err, attr),
    
    // Especializados para IA (con semántica extendida)
    ai: {
        error: (msg: string, err: Error, attr?: LogAttributes) => emit('ERROR', `[AI] ${msg}`, err, { ...attr, 'gen_ai.system': 'google_gemini' }),
        warn: (msg: string, attr?: LogAttributes) => emit('WARN', `[AI] ${msg}`, undefined, { ...attr, 'gen_ai.system': 'google_gemini' }),
        info: (msg: string, attr?: LogAttributes) => emit('INFO', `[AI] ${msg}`, undefined, { ...attr, 'gen_ai.system': 'google_gemini' }),
    },
    
    // Especializados para Base de Datos
    db: {
        error: (msg: string, err: any, attr?: LogAttributes) => {
            const errorObj = err instanceof Error ? err : new Error(JSON.stringify(err));
            return emit('ERROR', `[DB] ${msg}`, errorObj, attr);
        }
    }
};
