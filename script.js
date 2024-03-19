import * as THREE from "three";
import { DragControls } from "three/addons/controls/DragControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let map, panorama;

let position = {
  lat: -31.957235,
  lng: 115.816027,
};

function initialize() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: new google.maps.LatLng(position.lat, position.lng),
    zoom: 18,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControl: false,
    fullscreenControl: false,
    zoomControl: false,
  });

  panorama = new google.maps.StreetViewPanorama(
    document.getElementById("street-view"),
    {
      position: {
        lat: position.lat,
        lng: position.lng,
      },
      pov: {
        heading: 165,
        pitch: 0,
      },
      zoom: 1,
      addressControl: false,
      linksControl: false,
    }
  );

  map.setStreetView(panorama);
  panorama.addListener("pov_changed", updateScene);

  class CanvasOverlay extends google.maps.OverlayView {
    constructor() {
      super();
    }

    onAdd() {
      //const panes = this.getPanes();
      //panes.overlayLayer.appendChild(renderer.domElement);
      attachRenderer();
      initSlider();
    }

    draw() {}

    onRemove() {}
  }

  const overlay = new CanvasOverlay();
  overlay.setMap(panorama);
}

window.initialize = initialize;

//document.addEventListener("DOMContentLoaded", initSlider);

/********/

let scene = new THREE.Scene();
/*
let geometry = new THREE.BoxGeometry(1, 1, 1);
let material = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
});
let cube = new THREE.Mesh(geometry, material);
cube.position.set(0, 0.5, 13);
scene.add(cube);
*/

let sign;
const loader = new GLTFLoader();
let group = new THREE.Group();
loader.load(
  "./signboard-4x6.glb",
  function (gltf) {
    sign = gltf.scene;
    group.add(gltf.scene);
    scene.add(group);
    group.position.set(0, 0, 13);

    let material = new THREE.MeshPhongMaterial({ color: 0xffffff });

    let texmaterial = new THREE.MeshPhongMaterial();
    const texloader = new THREE.TextureLoader();
    const texture = texloader.load("./tex.png");
    texture.flipY = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    texmaterial.map = texture;

    sign.traverse((o) => {
      if (o.isMesh) {
        o.material = material;

        if (o.name == "Cube001") {
          o.material = texmaterial;
        }
      }
    });
  },
  undefined,
  function (error) {
    console.error(error);
  }
);

const light = new THREE.AmbientLight(0xffffff, 2);
scene.add(light);

const plane_geometry = new THREE.PlaneGeometry(10, 10);
const plane_material = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.5,
});
const plane = new THREE.Mesh(plane_geometry, plane_material);
plane.rotation.x = Math.PI / 2;
//scene.add(plane);

let renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
});

const fov = 50; // AKA Field of View
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 100);
camera.position.set(0, 2.5, 0);
camera.rotation.order = "YXZ";

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.render(scene, camera);

//const overlay = document.querySelector("#overlay");
//overlay.append(renderer.domElement);

let draggableObjects = [];
draggableObjects.push(group);
const dragControls = new DragControls(
  draggableObjects,
  camera,
  renderer.domElement
);
dragControls.transformGroup = true;
dragControls.addEventListener("drag", onDragEvent);
dragControls.addEventListener("hoveron", function () {
  panoCanvas.parentNode.parentNode.insertBefore(
    renderer.domElement,
    panoCanvas.parentNode
  );
});
dragControls.addEventListener("hoveroff", function () {
  panoCanvas.parentNode.insertBefore(renderer.domElement, panoCanvas);
});

window.addEventListener("mousemove", onMouseMove, false);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer?.setSize(window.innerWidth, window.innerHeight);
  renderer?.render(scene, camera);
  renderer?.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/****/

function updateScene() {
  camera.rotation.y = -panorama.pov.heading * (Math.PI / 180);
  camera.rotation.x = panorama.pov.pitch * (Math.PI / 180);
  var hfov = (Math.atan(Math.pow(2, 1 - panorama.zoom)) * 360) / Math.PI;
  camera.fov =
    (Math.atan(Math.tan((hfov * Math.PI) / 360) / camera.aspect) * 360) /
    Math.PI;
  /*
  console.log(
    "ar:" + camera.aspect + " z:" + panorama.zoom + " fov:" + camera.fov
  );
  */
  camera.updateProjectionMatrix();
  renderer?.render(scene, camera);
}

let panoCanvas;
function attachRenderer() {
  panoCanvas = document.querySelector("canvas");
  const panoParent = panoCanvas.parentNode;
  panoParent.insertBefore(renderer.domElement, panoCanvas);
  renderer.domElement.classList.add("threejs-canvas");
  //panoCanvas.prepend(renderer.domElement);
}

var mouse = new THREE.Vector2();

function onMouseMove(e) {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
}

var dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
var raycaster = new THREE.Raycaster();
var intersects = new THREE.Vector3();

function onDragEvent(e) {
  raycaster.setFromCamera(mouse, camera);
  raycaster.ray.intersectPlane(dragPlane, intersects);
  e.object.position.set(intersects.x, 0, intersects.z);
  //console.log(e.object.position);
  renderer?.render(scene, camera);
}

function initSlider() {
  const slider = document.getElementById("rotation-slider");
  slider.addEventListener("input", rotateSign);
  rotateSign();
}

function rotateSign() {
  const slider = document.getElementById("rotation-slider");
  sign.rotation.y = (slider.value * Math.PI) / 180;
  renderer?.render(scene, camera);
}
