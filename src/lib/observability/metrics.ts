import { metrics, type Meter, type Counter, type Histogram } from '@opentelemetry/api';

/**
 * Utilidad centralizada para el manejo de métricas personalizadas vía OpenTelemetry.
 * Permite registrar eventos de negocio, rendimiento de IA y salud del sistema.
 */
class Metrics {
    private meter: Meter;
    
    // Instrumentos de IA
    public aiRequestDuration: Histogram;
    public aiRequestTotal: Counter;
    
    // Instrumentos de Base de Datos
    public dbOperationDuration: Histogram;
    
    // Instrumentos de Negocio
    public evaluationCompletedTotal: Counter;

    constructor() {
        this.meter = metrics.getMeter('opera_eval_app_metrics');

        // Inicializar instrumentos
        this.aiRequestDuration = this.meter.createHistogram('ai_request_duration_ms', {
            description: 'Latencia de las peticiones a los modelos de IA',
            unit: 'ms',
        });

        this.aiRequestTotal = this.meter.createCounter('ai_request_total', {
            description: 'Total de peticiones realizadas a la IA',
        });

        this.dbOperationDuration = this.meter.createHistogram('db_query_duration_ms', {
            description: 'Latencia de las consultas a Supabase',
            unit: 'ms',
        });

        this.evaluationCompletedTotal = this.meter.createCounter('evaluation_finalized_total', {
            description: 'Total de evaluaciones finalizadas por los evaluadores',
        });
    }

    /**
     * Registra una petición a la IA con su duración y estado.
     */
    recordAiRequest(duration: number, attributes: { model_id: string; status: 'success' | 'error'; is_fallback?: boolean }) {
        this.aiRequestDuration.record(duration, attributes);
        this.aiRequestTotal.add(1, attributes);
    }

    /**
     * Registra la finalización de una evaluación.
     */
    recordEvaluationFinalized(attributes: { status: string }) {
        this.evaluationCompletedTotal.add(1, attributes);
    }

    /**
     * Registra la duración de una operación de base de datos.
     */
    recordDbOperation(duration: number, attributes: { table: string; operation: string; status: 'success' | 'error' }) {
        this.dbOperationDuration.record(duration, attributes);
    }
}

// Exportar instancia única
export const metricsApp = new Metrics();
