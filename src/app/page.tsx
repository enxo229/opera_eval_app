import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#E5E7EB] flex flex-col items-center justify-center p-8 space-y-8 text-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-[#00A3FF]">
          OTP: Observability Talent Pivot
        </h1>
        <p className="text-lg text-muted-foreground flex items-center justify-center gap-2 max-w-xl mx-auto">
          Plataforma de evaluación SRE/DevOps.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl bg-[#11151F] p-8 rounded-xl border border-[#1F2937]">
        <div className="space-y-4 flex flex-col items-center p-4 border border-[#1F2937] rounded-lg">
          <h2 className="text-xl font-semibold">Portal Evaluador</h2>
          <p className="text-sm text-muted-foreground">Revisar candidatos y registrar evaluaciones (Dimensión A, B, C).</p>
          <Link href="/evaluator" className="mt-auto pt-4">
            <Button className="bg-[#00A3FF] hover:bg-[#00A3FF]/80 text-white w-full">Ingresar a Dashboard</Button>
          </Link>
        </div>

        <div className="space-y-4 flex flex-col items-center p-4 border border-[#1F2937] rounded-lg">
          <h2 className="text-xl font-semibold">Consola Candidato</h2>
          <p className="text-sm text-muted-foreground">Entorno sin distracciones para ejercicios prácticos y chatbot IA.</p>
          <Link href="/candidate" className="mt-auto pt-4">
            <Button variant="outline" className="border-[#00A3FF] text-[#00A3FF] hover:bg-[#00A3FF]/10 w-full">Comenzar Evaluación</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
