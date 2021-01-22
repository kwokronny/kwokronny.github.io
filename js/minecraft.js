var scene, renderer, camera, stats, controls, container;
var mixer, clock, stage, actions;

// var duckyMixer, duckyAction;
function init() {
  container = document.querySelector(".bg-canvas");
  var width = container.getBoundingClientRect().width;
  var height = container.getBoundingClientRect().height;
  camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
  camera.position.set(0, 2, 16);

  clock = new THREE.Clock();

  scene = new THREE.Scene();
  // scene.background = new THREE.Color( 0xcccccc );
  // scene.fog = new THREE.FogExp2(0xffffff, 0.002);

  const hemiLight = new THREE.HemisphereLight(0xf2f2f2, 0xf2f2f2);
  hemiLight.position.set(0, 50, 0);
  scene.add(hemiLight);

  stage = new THREE.Object3D();
  stage.position.y = -4;
  // stage.scale.set(2, 2, 2);
  scene.add(stage);

  const dirLight = new THREE.DirectionalLight(0xffffff);
  dirLight.position.set(0, 30, 0);
  dirLight.castShadow = true;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 60;
  scene.add(dirLight);

  const groundTexture = new THREE.TextureLoader().load(
    "/gltf/textures/grass.png"
  );
  groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(4, 4);
  groundTexture.anisotropy = 16;
  groundTexture.encoding = THREE.sRGBEncoding;

  var bottomBase = new THREE.Mesh(
    new THREE.CylinderBufferGeometry(5, 5, 0.1, 32),
    new THREE.MeshLambertMaterial({ map: groundTexture })
  );
  bottomBase.receiveShadow = true;

  stage.add(bottomBase);

  var loader = new THREE.GLTFLoader();

  loader.load("/gltf/pumpkin.gltf", function (gltf) {
    var model = gltf.scene;
    model.traverse(function (object) {
      if (object.isMesh) {
        object.frustumCulled = false;
        object.castShadow = true;
      }
    });
    model.rotation.set(0, 1, 0);
    model.position.set(1, 0.1, -2.4);
    let scale = 0.33;
    model.scale.set(scale, scale, scale);
    stage.add(model);
  });

  loader.load("/gltf/zombie.gltf", function (gltf) {
    var model = gltf.scene;
    model.traverse(function (object) {
      if (object.isMesh) {
        object.frustumCulled = false;
        object.castShadow = true;
      }
    });
    model.position.set(0.6, 0, 2.5);
    model.scale.set(1.5, 1.5, 1.5);
    stage.add(model);

    mixer = new THREE.AnimationMixer(model);
    actions = {};

    actions.push_up = mixer.clipAction(gltf.animations[0]);
    actions.idle = mixer.clipAction(gltf.animations[1]);
    actions.walk = mixer.clipAction(gltf.animations[2]);
    actions.idle.play();
    animate();
    var loading = container.querySelector(".loading");
    container.removeChild(loading);
  });

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.autoRotate = false;
  controls.enableZoom = false;
  controls.minPolarAngle = Math.PI / 2;
  controls.maxPolarAngle = Math.PI / 2;
  container.appendChild(renderer.domElement);

  onWindowResize();
  window.addEventListener("resize", onWindowResize, false);
}

function animate() {
  requestAnimationFrame(animate);
  var delta = clock.getDelta();
  mixer.update(delta);
  controls.update();
  render();
}

function onWindowResize() {
  var width = container.getBoundingClientRect().width;
  var height = container.getBoundingClientRect().height;
  camera.aspect = width / height;
  if (window.innerWidth <= 640) {
    controls.enabled = false;
    camera.position.set(0, 3, 11);
    stage.position.y = -2;
    // stage.rotation.x = Math.PI*0.07;
  } else {
    controls.enabled = true;
    camera.position.set(0, 2, 16);
    stage.position.y = -4;
    stage.rotation.x = 0;
  }
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function render() {
  renderer.render(scene, camera);
}
init();

document
  .querySelectorAll(".bg-canvas .switch-action input")
  .forEach(function (el) {
    el.addEventListener("change", function (evt) {
      if (evt.target.type == "checkbox") {
        controls.autoRotate = !controls.autoRotate;
        controls.update();
      } else {
        Object.values(actions).forEach(function (action) {
          action.stop();
        });
        var name = evt.target.value;
        actions[name].play();
      }
    });
  });
