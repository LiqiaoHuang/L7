// @ts-ignore
import { IMapService } from '@antv/l7-core';
import Point from '../geo/point';
import TapRecognizer from './tap_recognizer';

export default class TapZoomHandler {
  public enabled: boolean;
  public active: boolean;
  public zoomIn: TapRecognizer;
  public zoomOut: TapRecognizer;

  constructor() {
    this.zoomIn = new TapRecognizer({
      numTouches: 1,
      numTaps: 2,
    });

    this.zoomOut = new TapRecognizer({
      numTouches: 2,
      numTaps: 1,
    });

    this.reset();
  }

  public reset() {
    this.active = false;
    this.zoomIn.reset();
    this.zoomOut.reset();
  }

  public touchstart(e: TouchEvent, points: Point[], mapTouches: Touch[]) {
    this.zoomIn.touchstart(e, points, mapTouches);
    this.zoomOut.touchstart(e, points, mapTouches);
  }

  public touchmove(e: TouchEvent, points: Point[], mapTouches: Touch[]) {
    this.zoomIn.touchmove(e, points, mapTouches);
    this.zoomOut.touchmove(e, points, mapTouches);
  }

  public touchend(e: TouchEvent, points: Point[], mapTouches: Touch[]) {
    const zoomInPoint = this.zoomIn.touchend(e, points, mapTouches);
    const zoomOutPoint = this.zoomOut.touchend(e, points, mapTouches);

    if (zoomInPoint) {
      this.active = true;
      e.preventDefault();
      setTimeout(() => this.reset(), 0);
      return {
        // TODO
        // cameraAnimation: (map: IMapService) => null
        // map.easeTo(
        //   {
        //     duration: 300,
        //     zoom: map.getZoom() + 1,
        //     around: map.lngLatToPixel(zoomInPoint),
        //   },
        //   { originalEvent: e },
        // ),
      };
    } else if (zoomOutPoint) {
      this.active = true;
      e.preventDefault();
      setTimeout(() => this.reset(), 0);
      return {
        // / TODO
        // cameraAnimation: (map: IMapService) =>
        //   map.easeTo(
        //     {
        //       duration: 300,
        //       zoom: map.getZoom() - 1,
        //       around: map.lngLatToPixel(zoomOutPoint),
        //     },
        //     { originalEvent: e },
        //   ),
      };
    }
  }

  public touchcancel() {
    this.reset();
  }

  public enable() {
    this.enabled = true;
  }

  public disable() {
    this.enabled = false;
    this.reset();
  }

  public isEnabled() {
    return this.enabled;
  }

  public isActive() {
    return this.active;
  }
}