import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as dat from "dat.gui";
import * as CANNON from "cannon-es";

import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader";

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const loadingManager = new THREE.LoadingManager();
const progressBar = document.getElementById("progress-bar");
const progressBarContainer = document.querySelector(".progress-bar-container");

loadingManager.onStart = function (url, itemsLoaded, itemsTotal) {
  console.log("Loading file:", url);
  console.log(`Loaded ${itemsLoaded} of ${itemsTotal} files`);
};

loadingManager.onLoad = function () {
  console.log("Loading complete!");
  progressBarContainer.style.display = "none";
};

loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
  console.log(`Loading file: ${url}`);
  console.log(`Progress: ${(itemsLoaded / itemsTotal) * 100}%`);
  progressBar.value = (itemsLoaded / itemsTotal) * 100;
};

loadingManager.onError = function (url) {
  console.log("Error loading file: " + url);
};

// Create cache for loaded textures
const textureCache = new Map();

const backgroundUrl = new URL("assets/background.exr", import.meta.url).href;

// Modified loader function
const exrLoader = new EXRLoader(loadingManager);
const loadEnvironmentMap = () => {
  // Check if texture is already cached
  if (textureCache.has("background")) {
    const texture = textureCache.get("background");
    scene.background = texture;
    scene.environment = texture;
    return;
  }

  exrLoader.load(
    backgroundUrl,
    function (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;

      // Adjust exposure and tone mapping to control brightness
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.1;

      scene.background = texture;
      scene.environment = texture;

      // Cache the loaded texture
      textureCache.set("background", texture);
    },
    undefined,
    function (error) {
      console.error("Error loading EXR:", error);
    },
  );
};

//! Call the loading function
loadEnvironmentMap();

const textUrl = new URL("assets/untitled.glb", import.meta.url).href;
const loader = new GLTFLoader(loadingManager);
loader.load(
  textUrl,
  (gltf) => {
    const sofa = gltf.scene;
    scene.add(sofa);

    // Change materials for all meshes
    sofa.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;

        // Create new material
        node.material = new THREE.MeshStandardMaterial({
          color: 0xff0000,
          metalness: 0.5,
          roughness: 0.3,
        });
      }
    });

    sofa.scale.set(3, 3, 3);
    sofa.position.y = 5;
    sofa.castShadow = true;
  },
  undefined,
  (error) => {
    console.error("Error loading GLTF model:", error);
  },
);

const logoTexture = {
  map: null,
};
const aphosLogoUrl = new URL("assets/aphos.glb", import.meta.url).href;

// Add cache for logo model
const modelCache = {
  logoModel: null,
};

// Load logo model once
loader.load(aphosLogoUrl, (gltf) => {
  modelCache.logoModel = gltf.scene.clone();
  // Initial logo setup
  const logo = modelCache.logoModel.clone();
  scene.add(logo);

  logo.traverse((node) => {
    if (node.isMesh && node.material.map) {
      logoTexture.map = node.material.map.clone();
    }

    const material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      envMapIntensity: 1.5,
      clearcoat: 0.5,
      clearcoatRoughness: 0.2,
      map: logoTexture.map,
    });

    node.material = material;
    node.castShadow = true;
    node.receiveShadow = true;
  });
  logo.rotation.x = Math.PI / 4;
  logo.position.set(3, 4, 7);
});

const scene = new THREE.Scene();

const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0),
});

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.z = 20;
camera.position.x = 25;
camera.position.y = 10;
controls.update();

scene.fog = new THREE.Fog(0xffffff, 0.2, 500);
// scene.fog = new THREE.FogExp2(0xffffff, 0.01);

// const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);

// const gridHelper = new THREE.GridHelper(100, 100);
// scene.add(gridHelper);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 15, 10);

// Configure shadow properties
directionalLight.shadow.camera.left = -40;
directionalLight.shadow.camera.right = 40;
directionalLight.shadow.camera.top = 40;
directionalLight.shadow.camera.bottom = -40;
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 100;

// Optional: increase shadow map size for better quality
directionalLight.shadow.mapSize.width = 3072;
directionalLight.shadow.mapSize.height = 3072;

directionalLight.castShadow = true;
scene.add(directionalLight);

// const directionalLightHelper = new THREE.DirectionalLightHelper(
//   directionalLight,
//   2,
// );
// scene.add(directionalLightHelper);

// const directionalLightShadowHelper = new THREE.CameraHelper(
//   directionalLight.shadow.camera,
// );
// scene.add(directionalLightShadowHelper);

// Create a box
const torusGeometry = new THREE.TorusGeometry();
const torusMaterial = new THREE.MeshStandardMaterial({
  color: 0x00ff00,
});
const torus = new THREE.Mesh(torusGeometry, torusMaterial);
torus.castShadow = true;

torus.position.y = 2;
scene.add(torus);

const planeGeometry = new THREE.BoxGeometry(60, 60, 2);
const planeMaterial = new THREE.MeshStandardMaterial({
  color: 0xf0f0f0,
  side: THREE.DoubleSide,
});
const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);

const planePhysMat = new CANNON.Material();

const planeBody = new CANNON.Body({
  shape: new CANNON.Box(new CANNON.Vec3(30, 30, 1)),
  type: CANNON.Body.STATIC,
  material: planePhysMat,
});

world.addBody(planeBody);
planeBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
planeBody.position.y = -4;

scene.add(planeMesh);
planeMesh.rotation.x = -0.5 * Math.PI;
planeMesh.receiveShadow = true;

const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
const sphereMaterial = new THREE.MeshStandardMaterial({
  color: 0xff0000,
});
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphere);

sphere.position.y = 2;
sphere.position.x = 4;
sphere.position.z = 4;
sphere.castShadow = true;

const options = {
  sphereColor: 0xff0000,
  wireframe: false,
  x: 4,
  y: 2,
  z: 4,
  speed: 0.01,
  angle: 0.4,
  decay: 0.3,
  penumbra: 0.1,
  distance: 80,
  intensity: 10,
  angle: 0.4,
};

const gui = new dat.GUI();
gui.add(options, "speed").min(0).max(0.1).step(0.01);
gui
  .add(options, "x")
  .min(0)
  .max(10)
  .step(0.01)
  .onChange((e) => {
    sphere.position.x = e;
  });
gui
  .add(options, "y")
  .min(0)
  .max(10)
  .step(0.01)
  .onChange((e) => {
    sphere.position.y = e;
  });
gui
  .add(options, "z")
  .min(0)
  .max(10)
  .step(0.01)
  .onChange((e) => {
    sphere.position.z = e;
  });
gui.addColor(options, "sphereColor").onChange((e) => {
  sphere.material.color.set(e);
});
gui.add(options, "wireframe").onChange((e) => {
  sphere.material.wireframe = e;
});

const ambientLight = new THREE.AmbientLight(0xffff00, 0.1);
scene.add(ambientLight);

const sphere2Geometry = new THREE.SphereGeometry(2.5);
const sphere2Material = new THREE.ShaderMaterial({
  vertexShader: document.getElementById("vertexShader").textContent,
  fragmentShader: document.getElementById("fragmentShader").textContent,
});
const sphere2 = new THREE.Mesh(sphere2Geometry, sphere2Material);
sphere2.castShadow = true;
scene.add(sphere2);
sphere2.position.set(3, 3, -5);

const mousePosition = new THREE.Vector2();

const raycaster = new THREE.Raycaster();
const intersectionPoint = new THREE.Vector3();
const planeNormal = new THREE.Vector3();
const plane = new THREE.Plane();
window.addEventListener("mousemove", (e) => {
  mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
  mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;
  planeNormal.copy(camera.position).normalize();
  plane.setFromNormalAndCoplanarPoint(planeNormal, scene.position);
  raycaster.ray.intersectPlane(plane, intersectionPoint);
});

const meshes = [];
const bodies = [];

// Add these variables at the top level, where other declarations are
let isMouseDown = false;
let lastCreationTime = 0;
const CREATION_DELAY = 100; // 100ms between creations

// Remove the old mousedown event listener and add these new ones
window.addEventListener("mousedown", () => {
  isMouseDown = true;
  createLogo();
});

window.addEventListener("mouseup", () => {
  isMouseDown = false;
});

function createLogo() {
  if (!isMouseDown) return;

  const currentTime = Date.now();
  if (currentTime - lastCreationTime < CREATION_DELAY) {
    requestAnimationFrame(createLogo);
    return;
  }

  lastCreationTime = currentTime;

  // Use cached model instead of loading
  if (modelCache.logoModel) {
    const logo = modelCache.logoModel.clone();
    scene.add(logo);

    const radius = 1;
    const height = 0.3;

    logo.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;

        const material = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          envMapIntensity: 1.5,
          clearcoat: 0.5,
          clearcoatRoughness: 0.2,
          map: logoTexture.map,
        });

        node.material = material;
      }
    });

    logo.position.set(
      intersectionPoint.x,
      intersectionPoint.y,
      intersectionPoint.z,
    );
    logo.rotation.x = Math.PI / 2;

    const cylinderShape = new CANNON.Cylinder(radius, radius, height);
    const logoBody = new CANNON.Body({
      mass: 1000,
      shape: cylinderShape,
      position: new CANNON.Vec3(
        intersectionPoint.x,
        intersectionPoint.y,
        intersectionPoint.z,
      ),
      material: planePhysMat,
      linearDamping: 0.1,
      angularDamping: 0.1,
      fixedRotation: false,
    });
    logoBody.angularVelocity.set(4, 10, 10);

    world.addBody(logoBody);
    meshes.push(logo);
    bodies.push(logoBody);

    const groundLogoContactMat = new CANNON.ContactMaterial(
      planePhysMat,
      planePhysMat,
      {
        friction: 0.1,
        restitution: 0.3,
        frictionEquationRegularizationTime: 3,
      },
    );

    world.addContactMaterial(groundLogoContactMat);

    setTimeout(() => {
      if (meshes.length > 0) {
        const lastMesh = meshes.shift();
        scene.remove(lastMesh);
      }

      if (bodies.length > 0) {
        const lastBody = bodies.shift();
        world.removeBody(lastBody);
      }
    }, 10000);

    requestAnimationFrame(createLogo);
  }
}

// Physics
const sphereGeo = new THREE.SphereGeometry(2);
const sphereMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
scene.add(sphereMesh);
sphereMesh.position.set(14, 10, 0);
sphereMesh.castShadow = true;

const timeStep = 1 / 60;

const spherePhysMat = new CANNON.Material();
const sphereShape = new CANNON.Sphere(2);
const sphereBody = new CANNON.Body({
  mass: 10,
  shape: sphereShape,
  position: new CANNON.Vec3(14, 10, 0),
  material: spherePhysMat,
});

world.addBody(sphereBody);
sphereBody.linearDamping = 0.31;

// Box
const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
scene.add(boxMesh);
boxMesh.position.set(15, 11, 0);
boxMesh.castShadow = true;

const boxShape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
const boxBody = new CANNON.Body({
  mass: 40,
  shape: boxShape,
  position: new CANNON.Vec3(15.5, 13, 8),
});
boxBody.angularVelocity.set(0, 5, 2);

world.addBody(boxBody);

let step = 0;
const sphereId = sphere.id;

function animate(time) {
  //Physics
  world.step(timeStep);
  sphereMesh.position.copy(sphereBody.position);
  sphereMesh.quaternion.copy(sphereBody.quaternion);

  planeMesh.position.copy({ ...planeBody.position });
  planeMesh.quaternion.copy(planeBody.quaternion);

  boxMesh.position.copy(boxBody.position);
  boxMesh.quaternion.copy(boxBody.quaternion);

  torus.rotation.x = time / 1000;
  torus.rotation.y = time / 1000;

  step += options.speed;
  sphere.position.y = options.y + 2 * Math.abs(Math.sin(step));

  raycaster.setFromCamera(mousePosition, camera);
  const intersects = raycaster.intersectObjects(scene.children);

  for (let i = 0; i < meshes.length; i++) {
    meshes[i].position.copy(bodies[i].position);
    meshes[i].quaternion.copy(bodies[i].quaternion);
  }

  // Check if sphere is intersected
  let isSphereHovered = false;
  for (const intersect of intersects) {
    if (intersect.object.id === sphereId) {
      intersect.object.material.color.set(0x0000ff);
      isSphereHovered = true;
      break;
    }
  }

  // Only reset color if sphere is not hovered
  if (!isSphereHovered) {
    sphere.material.color.set(0xff0000);
  }

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
