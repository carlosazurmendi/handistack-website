import React from 'react'

// Nav-sidebar mark (admin.components.graphics.Icon). Keeps the optional `fill`
// prop for API-compatibility with the stock PayloadIcon, though the raster mark
// ignores it.
export const Icon: React.FC<{ fill?: string }> = () => (
  <img
    src="/handistack-mark.png"
    alt="Handistack"
    style={{ width: 'auto', height: '100%', maxHeight: 28, objectFit: 'contain' }}
  />
)

export default Icon
