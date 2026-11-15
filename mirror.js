import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { Parser } from '@etothepii/satisfactory-file-parser';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

function isTriangularWall(typePath) {
  const name = (typePath || '').toLowerCase();
  return name.includes('tris');
}

function isCatwalkCorner(typePath) {
  const name = (typePath || '').toLowerCase();
  return (name.includes('catwalk') || name.includes('walkway')) && name.includes('corner');
}

function getLocalCenterOffset(typePath) {
  const name = typePath || '';
  if (name.includes('Wall') || name.includes('Window') || name.includes('Door') || name.includes('Gate')) {
    if (name.includes('_8x1') || name.includes('1m')) return { x: 0, y: 0, z: 50 };
    if (name.includes('_8x2') || name.includes('2m')) return { x: 0, y: 0, z: 100 };
    if (name.includes('_8x8') || name.includes('8m')) return { x: 0, y: 0, z: 400 };
    return { x: 0, y: 0, z: 200 };
  }
  if (name.includes('Pillar')) {
    return { x: 0, y: 0, z: 200 };
  }
  return { x: 0, y: 0, z: 0 };
}

function rotateVectorByBasis(v, f, r, u) {
  return {
    x: v.x * f.x + v.y * r.x + v.z * u.x,
    y: v.x * f.y + v.y * r.y + v.z * u.y,
    z: v.x * f.z + v.y * r.z + v.z * u.z
  };
}

function mirrorObject3Steps(translation, rotation, axis, originalTypePath, stats) {
  const { x, y, z, w } = rotation;

  let f = {
    x: 1 - 2 * (y * y + z * z),
    y: 2 * (x * y + z * w),
    z: 2 * (x * z - y * w)
  };
  let r = {
    x: 2 * (x * y - z * w),
    y: 1 - 2 * (x * x + z * z),
    z: 2 * (y * z + x * w)
  };
  let u = {
    x: 2 * (x * z + y * w),
    y: 2 * (y * z - x * w),
    z: 1 - 2 * (x * x + y * y)
  };

  const localOffsetBefore = getLocalCenterOffset(originalTypePath);
  const worldOffsetBefore = rotateVectorByBasis(localOffsetBefore, f, r, u);
  const worldCenter = {
    x: translation.x + worldOffsetBefore.x,
    y: translation.y + worldOffsetBefore.y,
    z: translation.z + worldOffsetBefore.z
  };

  if (axis === 'X') {
    worldCenter.x = -worldCenter.x;
    f.x = -f.x; r.x = -r.x; u.x = -u.x;
  } else {
    worldCenter.y = -worldCenter.y;
    f.y = -f.y; r.y = -r.y; u.y = -u.y;
  }

  const name = originalTypePath || '';

  if (isCatwalkCorner(name)) {
    r.x = -r.x; r.y = -r.y; r.z = -r.z;
    const oldF = { ...f };
    f = { ...r };
    r = { x: -oldF.x, y: -oldF.y, z: -oldF.z };
    stats.corners++;
  } else if (isTriangularWall(name) || name.includes('QuarterPipe') || name.includes('Sign') || name.includes('Billboard')) {
    f.x = -f.x; f.y = -f.y; f.z = -f.z;
    if (isTriangularWall(name)) stats.rampWalls++;
  } else {
    r.x = -r.x; r.y = -r.y; r.z = -r.z;
  }

  const localOffsetAfter = getLocalCenterOffset(originalTypePath);
  const worldOffsetAfter = rotateVectorByBasis(localOffsetAfter, f, r, u);
  const newPivotPos = {
    x: worldCenter.x - worldOffsetAfter.x,
    y: worldCenter.y - worldOffsetAfter.y,
    z: worldCenter.z - worldOffsetAfter.z
  };

  const trace = f.x + r.y + u.z;
  let qw, qx, qy, qz;

  if (trace > 0) {
    const s = 0.5 / Math.sqrt(trace + 1.0);
    qw = 0.25 / s;
    qx = (r.z - u.y) * s;
    qy = (u.x - f.z) * s;
    qz = (f.y - r.x) * s;
  } else if (f.x > r.y && f.x > u.z) {
    const s = 2.0 * Math.sqrt(1.0 + f.x - r.y - u.z);
    qw = (r.z - u.y) / s;
    qx = 0.25 * s;
    qy = (r.x + f.y) / s;
    qz = (u.x + f.z) / s;
  } else if (r.y > u.z) {
    const s = 2.0 * Math.sqrt(1.0 + r.y - f.x - u.z);
    qw = (u.x - f.z) / s;
    qx = (r.x + f.y) / s;
    qy = 0.25 * s;
    qz = (r.z + u.y) / s;
  } else {
    const s = 2.0 * Math.sqrt(1.0 + u.z - f.x - r.y);
    qw = (f.y - r.x) / s;
    qx = (u.x + f.z) / s;
    qy = (r.z + u.y) / s;
    qz = 0.25 * s;
  }

  return {
    translation: newPivotPos,
    rotation: { x: qx, y: qy, z: qz, w: qw }
  };
}

function swapAsymmetricAsset(typePath) {
  if (!typePath) return typePath;
  if (typePath.includes('_Left')) return typePath.replace('_Left', '_Right');
  if (typePath.includes('_Right')) return typePath.replace('_Right', '_Left');
  if (typePath.includes('Left_')) return typePath.replace('Left_', 'Right_');
  if (typePath.includes('Right_')) return typePath.replace('Right_', 'Left_');
  return typePath;
}

async function main() {
  console.log('=== SATISFACTORY 1.2 BLUEPRINT MIRROR ===\n');

  const sbpPath = (await ask('Drag and drop your .sbp file here and press ENTER:\n> ')).replace(/["']/g, '').trim();
  
  if (!fs.existsSync(sbpPath) || !sbpPath.endsWith('.sbp')) {
    console.log('\n❌ Invalid .sbp file.');
    rl.close();
    return;
  }

  const axisInput = (await ask('\nWhich axis do you want to mirror? (Type X or Y):\n> ')).trim().toUpperCase();
  const axis = axisInput === 'Y' ? 'Y' : 'X';

  const dir = path.dirname(sbpPath);
  const baseName = path.basename(sbpPath, '.sbp');
  const cfgPath = path.join(dir, `${baseName}.sbpcfg`);

  const mainFile = new Uint8Array(fs.readFileSync(sbpPath)).buffer;
  const configFile = new Uint8Array(fs.readFileSync(cfgPath)).buffer;

  const blueprint = Parser.ParseBlueprintFiles(baseName, mainFile, configFile);

  let count = 0;
  const stats = { rampWalls: 0, corners: 0 };
  const objects = blueprint.objects || [];
  for (const obj of objects) {
    const originalType = obj.typePath;

    if (obj.transform && obj.transform.translation && obj.transform.rotation) {
      const mirrored = mirrorObject3Steps(
        obj.transform.translation,
        obj.transform.rotation,
        axis,
        originalType,
        stats
      );
      obj.transform.translation = mirrored.translation;
      obj.transform.rotation = mirrored.rotation;
      count++;
    }

    if (obj.typePath) {
      obj.typePath = swapAsymmetricAsset(obj.typePath);
    }

    if (obj.properties && obj.properties.mEndLocation) {
      if (axis === 'X') {
        obj.properties.mEndLocation.x = -obj.properties.mEndLocation.x;
      } else {
        obj.properties.mEndLocation.y = -obj.properties.mEndLocation.y;
      }
    }
  }

  const newName = `${baseName}_MIRROR_${axis}`;
  blueprint.name = newName;

  const outSbp = path.join(dir, `${newName}.sbp`);
  const outCfg = path.join(dir, `${newName}.sbpcfg`);

  const sbpParts = [];
  const result = Parser.WriteBlueprintFiles(
    blueprint,
    (header) => {
      sbpParts.push(Buffer.from(header));
    },
    (chunk) => {
      sbpParts.push(Buffer.from(chunk));
    }
  );

  const finalSbpBuffer = Buffer.concat(sbpParts);
  const finalCfgBuffer = Buffer.from(result.configFileBinary);

  Parser.ParseBlueprintFiles(
    newName,
    new Uint8Array(finalSbpBuffer).buffer,
    new Uint8Array(finalCfgBuffer).buffer
  );

  fs.writeFileSync(outSbp, finalSbpBuffer);
  fs.writeFileSync(outCfg, finalCfgBuffer);

  console.log(`\n✅ Done! ${count} pieces mirrored (${stats.rampWalls} Tris, ${stats.corners} Corners) into ${newName}.sbp!`);
  rl.close();
}

main().catch((err) => {
  console.error('\n❌ Error:', err);
  rl.close();
});
