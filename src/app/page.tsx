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
          Plataforma de evaluación para el equipo Ópera. Identifica a las próximas estrellas del talento SRE.
        </p>
      </div>

      <div className="mt-8">
        <Link href="/login">
          <Button size="lg" className="bg-[#00A3FF] hover:bg-[#00A3FF]/80 text-white text-lg px-8 py-6 rounded-full font-semibold shadow-[0_0_20px_rgba(0,163,255,0.4)] hover:shadow-[0_0_30px_rgba(0,163,255,0.6)] transition-all">
            Ingresar a la Plataforma
          </Button>
        </Link>
      </div>
    </div>
  )
}
