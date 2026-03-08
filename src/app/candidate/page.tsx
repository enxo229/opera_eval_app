import { TicketEditor } from '@/components/candidate/TicketEditor'
import { ChatbotA4 } from '@/components/candidate/ChatbotA4'

export default function CandidateDashboard() {
    return (
        <div className="space-y-12">
            <div className="text-center space-y-4">
                <h1 className="text-3xl sm:text-4xl text-primary drop-shadow-sm">Evaluación Técnica: Observabilidad</h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Resuelve los siguientes módulos. Lee atentamente las instrucciones de cada uno. Tu progreso será registrado automáticamente.
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-12 items-start">
                {/* Módulo B1 */}
                <div className="space-y-4">
                    <h2 className="text-2xl border-b pb-2 text-foreground">
                        Manejo de Incidentes
                    </h2>
                    <TicketEditor />
                </div>

                {/* Módulo A4 */}
                <div className="space-y-4">
                    <h2 className="text-2xl border-b pb-2 text-foreground">
                        Troubleshooting Asistido
                    </h2>
                    <ChatbotA4 />
                </div>
            </div>
        </div>
    )
}
