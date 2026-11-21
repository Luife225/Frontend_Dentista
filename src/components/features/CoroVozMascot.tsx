import { MASCOT_ASSETS, MASCOT_LABELS, type CoroVozMascotState } from '../../utils/coroVozMascot'
import CoroVozIcon from './CoroVozIcon'

export default function CoroVozMascot({ state }: { state: CoroVozMascotState }) {
  return <span className="corovoz-character" role="img" aria-label={MASCOT_LABELS[state]}>
    <span className="corovoz-mascot-halo" aria-hidden="true" />
    {/* Small, independent assets are loaded together so live state changes never flash. */}
    {(Object.entries(MASCOT_ASSETS) as [CoroVozMascotState, string][]).map(([pose, file]) =>
      <img key={pose} src={`${import.meta.env.BASE_URL}images/coronix-states/${file}`} width="320" height="320"
        alt="" aria-hidden="true" draggable="false" decoding="async" className={`corovoz-pose ${pose === state ? 'is-current' : ''}`} />
    )}
    {state === 'listening' && <span className="corovoz-audio-waves" aria-hidden="true"><i /><i /><i /><i /><i /></span>}
    {state === 'thinking' && <span className="corovoz-dots" aria-hidden="true"><i /><i /><i /></span>}
    {state === 'success' && <span className="corovoz-state-badge is-success" aria-hidden="true"><CoroVozIcon name="check" /></span>}
    {state === 'error' && <span className="corovoz-state-badge is-error" aria-hidden="true">!</span>}
  </span>
}
