import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Convert a glTF-style JSON scene to an array of SrcObj objects
 * @param {Object} json - The glTF JSON scene
 * @param {string} baseUrl - Base URL for assets
 * @returns {Array} Array of SrcObj objects
 */
function glxfToSrc(json, baseUrl = '') {
  const srcObjects = [];

  // Get the root scene
  const rootScene = json.scenes[json.scene];
  if (!rootScene) return srcObjects;

  // Function to process nodes recursively
  function processNode(nodeIndex) {
    const node = json.nodes[nodeIndex];
    if (!node) return;

    // If this node has an asset, create a SrcObj
    if (node.asset !== undefined && json.assets[node.asset]) {
      const asset = json.assets[node.asset];
      const srcObj = {
        url: baseUrl + asset.uri,
        label: node.name,
      };

      // Add position if translation exists
      if (node.translation) {
        srcObj.position = [node.translation[0], node.translation[1], node.translation[2]];
      }

      // Add rotation if it exists (convert from quaternion to Euler if needed)
      if (node.rotation) {
        // Note: The JSON has quaternion rotation [x, y, z, w]
        // You might need to convert this to Euler angles depending on your needs
        // For now, we'll store it as-is and let Three.js handle it
        srcObj.rotation = [node.rotation[0], node.rotation[1], node.rotation[2]];
      }

      // Add scale if it exists
      if (node.scale) {
        srcObj.scale = [node.scale[0], node.scale[1], node.scale[2]];
      }

      srcObjects.push(srcObj);
    }

    // Process children recursively
    if (node.children) {
      node.children.forEach((childIndex) => processNode(childIndex));
    }
  }

  // Process all root nodes
  rootScene.nodes.forEach((nodeIndex) => processNode(nodeIndex));

  return srcObjects;
}

// Read the TableScene.json file
const sceneJsonPath = resolve(__dirname, '../fixtures/glxf/TableScene.json');
const sceneJson = JSON.parse(readFileSync(sceneJsonPath, 'utf8'));

// Base URL for the assets (adjust as needed)
const baseUrl = 'https://glxf-demo-assets.vercel.app/';

// Convert the scene to SrcObj array
const srcArray = glxfToSrc(sceneJson, baseUrl);

// Output the result
console.log(JSON.stringify(srcArray, null, 2));
