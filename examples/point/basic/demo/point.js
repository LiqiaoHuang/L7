import { Scene } from '@l7/scene';
import { PointLayer } from '@l7/layers'
console.log(scene);
const scene = new Scene({
  id: 'map',
  pitch: 0,
  type: 'amap',
  style: 'dark',
  center: [121.40, 31.258134],
  zoom: 15,
});

fetch('https://gw.alipayobjects.com/os/basement_prod/893d1d5f-11d9-45f3-8322-ee9140d288ae.json')
  .then((res) => res.json())
  .then((data) => {
    const pointLayer =
      new PointLayer()
        .source(data, {
          parser: {
            type: 'json',
            x: 'longitude',
            y: 'latitude'
          }
        }).shape('circle')
        .size('unit_price', [5, 25])
        .color('#2F54EB')
        .style({
          opacity: 1.0,
          strokeWidth: 2,
          strokeColor: "#fff",

        })
        // scene.on('loaded',()=>{
        //   console.log('----------loaded')
          scene.addLayer(pointLayer);
        // })
        scene.render();
  });


