import { TicketEditor } from '@/components/candidate/TicketEditor'
import { ChatbotA4 } from '@/components/candidate/ChatbotA4'

export default function CandidateDashboard() {
    return (
        <div className="space-y-12">
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold tracking-tight text-[#00A3FF]">Evaluación Técnica: Observabilidad</h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Resuelve los siguientes módulos. Lee atentamente las instrucciones de cada uno. Tu progreso será registrado automáticamente.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Módulo B1 */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b border-[#1F2937] pb-2 text-[#E5E7EB]">
                        Manejo de Incidentes
                    </h2>
                    <TicketEditor />
                </div>

                {/* Módulo A4 */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b border-[#1F2937] pb-2 text-[#E5E7EB]">
                        Troubleshooting Asistido
                    </h2>
                    <ChatbotA4 />
                </div>
            </div>
        </div>
    )
}
