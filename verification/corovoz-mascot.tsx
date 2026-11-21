// Visual asset inspection only. The application derives state from actual voice/API activity.
import { createRoot } from 'react-dom/client'
import CoroVozMascot from '../src/components/features/CoroVozMascot'
import type { CoroVozMascotState } from '../src/utils/coroVozMascot'
import '../src/index.css'
import '../src/components/features/CoroVozAssistant.css'

const poses: [CoroVozMascotState, string, string][] = [
  ['idle', 'Reposo', 'Listo para acompañarte'], ['speaking', 'Hablando', 'Reproduciendo la respuesta'],
  ['listening', 'Escuchando', 'Micrófono captando voz'], ['thinking', 'Pensando', 'Preparando la respuesta'],
  ['choosing', 'Preguntando', 'Esperando tu elección'], ['success', 'Éxito', 'Acción realizada correctamente'],
  ['error', 'Advertencia', 'Una operación necesita atención'], ['minimized', 'Minimizado', 'A un clic de ayudarte'],
]

createRoot(document.getElementById('root')!).render(<main style={{maxWidth:1100,margin:'auto',padding:'36px 24px',color:'#0b3d3a'}}>
  <p style={{fontSize:11,letterSpacing:3,fontWeight:600,color:'#1e8c82'}}>CORONIX · ASISTENTE DE VOZ</p>
  <h1 style={{fontFamily:'Outfit',fontSize:34,margin:'8px 0'}}>Una identidad. Ocho expresiones.</h1>
  <p style={{fontSize:13,color:'#64748b',marginBottom:28}}>Galería de recursos independientes. Las burbujas y los controles se dibujan en la interfaz.</p>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:16}}>
    {poses.map(([state,label,description]) => <section key={state} data-state={state} style={{background:'white',border:'1px solid #dfe9e5',borderRadius:20,padding:'20px 16px',textAlign:'center'}}>
      <div className="corovoz-mascot" style={{width:170,height:174,margin:'0 auto 12px'}}><CoroVozMascot state={state}/></div>
      <h2 style={{fontFamily:'Outfit',fontSize:18,fontWeight:500}}>{label}</h2><p style={{fontSize:11,color:'#64748b',marginTop:4}}>{description}</p>
    </section>)}
  </div>
</main>)
