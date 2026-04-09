import { registerOTel } from '@vercel/otel';
import { logs } from '@opentelemetry/api-logs';
import { metrics } from '@opentelemetry/api';
import { LoggerProvider, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

export function register() {
  // 1. Traces & Metrics (Vercel)
  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME || 'opera_eval_app',
  });

  // 2. Logs (Standard OTel SDK)
  if (typeof window === 'undefined') {
    const resource = new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'opera_eval_app',
      // Los demás atributos (owner.team, client.name, etc) los lee el SDK de OTEL_RESOURCE_ATTRIBUTES automáticamente
    });

    const logExporter = new OTLPLogExporter();
    
    const loggerProvider = new LoggerProvider({ 
      resource,
      processors: [new BatchLogRecordProcessor(logExporter)]
    });

    // Registrar globalmente Logger
    logs.setGlobalLoggerProvider(loggerProvider);

    // 3. Metrics (Standard OTel SDK)
    const metricReader = new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter(), // Usa OTEL_EXPORTER_OTLP_ENDPOINT por defecto
      exportIntervalMillis: 60000,
    });

    const meterProvider = new MeterProvider({
      resource,
      readers: [metricReader],
    });

    // Registrar globalmente Meter
    metrics.setGlobalMeterProvider(meterProvider);
  }
}
