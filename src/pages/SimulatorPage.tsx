import { Simulator } from '../components/Simulator';

export function SimulatorPage() {
  return (
    <div className="page">
      <div className="eyebrow">Sandbox</div>
      <h1>Virtual camera</h1>
      <p className="lede">
        Every setting changes the picture the way it would on a real camera: aperture blurs the background, shutter speed
        freezes or smears motion, ISO adds noise, and all three change brightness. Drag the dials and watch.
      </p>
      <Simulator scenes="all" layout="wide" />
    </div>
  );
}
