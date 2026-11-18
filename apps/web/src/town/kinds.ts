// Which piece each building draws (M2c spec, "Parts"; D-057 Q3). A Cottage draws its plot's own cottage
// piece, with cottage a's own tier 2 and 3 pieces on a plot whose piece is cottage a. The Workshop,
// Storehouse and Tavern draw cottage pieces b, c and e with a trade sign (baked per plot by the pack), until
// M2b step 4's PixelLab pieces exist. A site kind draws its site's piece; on a plot (a second Mine, say) it
// draws the same piece standing on the plot.
import { PIECES } from './pieces';

const STAND_INS = new Set(['workshop', 'storehouse', 'tavern']);

// The piece's name, and whether it stands where the pack placed it (false: draw it on `spot`'s bottom centre).
export function pieceFor(
  kind: string,
  tier: number,
  spot: string,
): { name: string; native: boolean } {
  if (spot === 'hall') return { name: 'hall', native: true };
  if (spot.startsWith('site_')) return { name: spot, native: true };
  if (kind === 'cottage') {
    const grown = `${spot}_t${tier}`;
    return { name: grown in PIECES ? grown : spot, native: true };
  }
  if (STAND_INS.has(kind)) return { name: `${spot}_${kind}`, native: true };
  return { name: `site_${kind}`, native: false };
}
