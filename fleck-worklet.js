import { spline } from "@georgedoescode/generative-utils";
import { Vector2D } from "@georgedoescode/vector2d";

// allow up to 8 fleck colors, an arbitrary number but should account for most uses
const FLECK_COLOR_PROPS = [...Array(8)].map((_, i) => `--fleck-color-${i + 1}`);

// mulberry32 source: https://github.com/bryc/code/blob/master/jshash/PRNGs.md
function mulberry32(a) {
  return function (min, max) {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * (max - min) + min;
  };
}

class Fleck {
  static get inputProperties() {
    return [
      "--fleck-seed",
      "--fleck-count",
      "--min-fleck-size",
      "--max-fleck-size",
      ...FLECK_COLOR_PROPS,
    ];
  }

  // iterate through props and store defined "--fleck-color-x" variables in an array
  getDefinedColors(props) {
    return FLECK_COLOR_PROPS.map((key) => {
      return props.get(key).toString().trim();
    }).filter((value) => value);
  }

  // CSSUnparsedValue > String/Number
  parseProp(prop, num = false) {
    const value = prop.toString().trim();
    return num ? parseFloat(value) : value;
  }

  paint(ctx, size, props) {
    const seed = this.parseProp(props.get("--fleck-seed"));
    const count = this.parseProp(props.get("--fleck-count"));
    const colors = this.getDefinedColors(props);

    const width = size.width;
    const height = size.height;

    const random = mulberry32(seed);

    for (let i = 0; i < count; i++) {
      const numPoints = ~~random(6, 8);
      const points = [];
      const angleStep = (Math.PI * 2) / numPoints;
      const center = new Vector2D(random(0, width), random(0, height));

      // Ensure "flecks" scale to the size of the element
      let radius = (width * height) / 150000;
      // Most of the time, do a little fleck
      if (random(0, 1) > 0.125) radius /= 2;
      // Every now and then, do a big fleck
      if (random(0, 1) > 0.925) radius *= 4;
      // Make sure the fleck doesn't get too big or too small
      radius = Math.max(1, Math.min(radius, 24));

      // Plot equidistant points around a circle
      for (let i = 1; i <= numPoints; i++) {
        const theta = i * angleStep;
        const point = new Vector2D(
          center.x + Math.cos(theta) * radius,
          center.y + Math.sin(theta) * radius
        );

        // "Pull" each point a random amount towards the center of the circle
        points.push(Vector2D.lerp(point, center, random(0, 0.625)));
      }

      // Pick a random color
      const fill = colors[~~random(0, colors.length)];

      // Render the fleck!
      ctx.fillStyle = fill;

      ctx.beginPath();

      // Learn more about spline here: https://georgefrancis.dev/writing/a-generative-svg-starter-kit/
      spline(points, 1, true, (CMD, data) => {
        if (CMD === "MOVE") {
          ctx.moveTo(...data);
        } else {
          ctx.bezierCurveTo(...data);
        }
      });

      ctx.fill();
    }
  }
}

registerPaint("fleck", Fleck);
