const routes = [
  { d: "M118 268 Q170 140 268 108", city: "London", x: 278, y: 96 },
  { d: "M118 268 Q250 90 430 96", city: "Berlin", x: 440, y: 86 },
  { d: "M118 268 Q230 200 352 228", city: "Dubai", x: 364, y: 214 },
  { d: "M118 268 Q300 230 492 286", city: "Singapore", x: 504, y: 272 },
  { d: "M118 268 Q300 390 520 404", city: "Sydney", x: 530, y: 418 },
  { d: "M118 268 Q90 160 196 156", city: "Boston", x: 208, y: 142 },
];

export function MovementVisual() {
  return (
    <figure className="relative overflow-hidden border border-line bg-surface">
      <svg
        viewBox="0 0 640 500"
        role="img"
        aria-label="Illustrative routes from Jaipur to partner cities"
        className="h-auto w-full"
      >
        <circle
          cx="300"
          cy="260"
          r="188"
          fill="none"
          className="stroke-line"
        />
        <circle
          cx="300"
          cy="260"
          r="118"
          fill="none"
          className="stroke-hairline"
        />
        {routes.map((route) => (
          <path
            key={route.city}
            d={route.d}
            fill="none"
            strokeWidth="1.15"
            className="route-flow stroke-viz-route"
          />
        ))}
        <g>
          <circle cx="118" cy="268" r="11" className="node-pulse fill-viz-halo" />
          <circle cx="118" cy="268" r="4.5" className="fill-viz-node" />
          <text x="132" y="264" className="fill-foreground" fontSize="13" fontFamily="inherit">
            Jaipur
          </text>
          <text x="132" y="280" className="fill-cyan" fontSize="10" letterSpacing="1.4" fontFamily="inherit">
            MUJ
          </text>
        </g>
        {routes.map((route) => {
          const end = routeEnd(route.d);
          return (
            <g key={route.city}>
              <circle cx={end.x} cy={end.y} r="3" className="fill-primary" />
              <text
                x={route.x}
                y={route.y}
                className="fill-fg-soft"
                fontSize="12"
                fontFamily="inherit"
              >
                {route.city}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="border-t border-line px-5 py-3 text-[12px] tracking-[0.04em] text-muted-foreground">
        Movement between campuses — an illustration, not a flight map.
      </figcaption>
    </figure>
  );
}

function routeEnd(d: string) {
  const parts = d.split(" ");
  const x = Number(parts[parts.length - 2]);
  const y = Number(parts[parts.length - 1]);
  return { x, y };
}
