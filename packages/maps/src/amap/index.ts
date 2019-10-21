/**
 * AMapService
 */
import {
  Bounds,
  CoordinateSystem,
  ICoordinateSystemService,
  ILngLat,
  IMapCamera,
  IMapConfig,
  IMapService,
  IPoint,
  IViewport,
  Point,
  TYPES,
} from '@l7/core';
import { inject, injectable } from 'inversify';
import Viewport from './Viewport';

const AMAP_API_KEY: string = '15cd8a57710d40c9b7c0e3cc120f1200';
const AMAP_VERSION: string = '1.4.8';
const LNGLAT_OFFSET_ZOOM_THRESHOLD = 12;

/// <reference path="../../../../../node_modules/@types/amap-js-api/index.d.ts" />

/**
 * AMapService
 */
@injectable()
export default class AMapService implements IMapService {
  @inject(TYPES.ICoordinateSystemService)
  private readonly coordinateSystemService: ICoordinateSystemService;

  private map: AMap.Map;

  private viewport: Viewport;

  private cameraChangedCallback: (viewport: IViewport) => void;
  public getZoom(): number {
    return this.map.getZoom();
  }
  public getCenter(): ILngLat {
    const center = this.map.getCenter();
    return {
      lng: center.getLng(),
      lat: center.getLat(),
    };
  }
  public getPitch(): number {
    return this.map.getPitch();
  }
  public getRotation(): number {
    return this.map.getRotation();
  }
  public getBounds(): Bounds {
    // @ts-ignore
    const amapBound = this.map.getBounds().toBounds();
    const NE = amapBound.getNorthEast();
    const SW = amapBound.getSouthWest();
    return [[NE.getLng(), NE.getLat()], [SW.getLng(), SW.getLat()]];
  }
  public setRotation(rotation: number): number {
    return this.setRotation(rotation);
  }

  public zoomIn(): void {
    this.map.zoomIn();
  }

  public zoomOut(): void {
    this.map.zoomOut();
  }

  public panTo(p: [number, number]): void {
    this.map.panTo(p);
  }
  public panBy(pixel: [number, number]): void {
    this.map.panTo(pixel);
  }
  public fitBounds(extent: Bounds): void {
    this.map.setBounds(
      new AMap.Bounds([extent[0][0], extent[0][1], extent[1][0], extent[1][1]]),
    );
  }
  public setZoomAndCenter(zoom: number, center: [number, number]): void {
    this.map.setZoomAndCenter(zoom, center);
  }
  public setMapStyle(style: string): void {
    this.setMapStyle(style);
  }
  public pixelToLngLat(pixel: [number, number]): ILngLat {
    const lngLat = this.map.pixelToLngLat(new AMap.Pixel(pixel[0], pixel[1]));
    return { lng: lngLat.getLng(), lat: lngLat.getLat() };
  }
  public lngLatToPixel(lnglat: [number, number]): IPoint {
    const p = this.map.lnglatToPixel(new AMap.LngLat(lnglat[0], lnglat[1]));
    return {
      x: p.getX(),
      y: p.getY(),
    };
  }
  public containerToLngLat(pixel: [number, number]): ILngLat {
    const ll = new AMap.Pixel(pixel[0], pixel[1]);
    const lngLat = this.map.containerToLngLat(ll);
    return {
      lng: lngLat.getLng(),
      lat: lngLat.getLat(),
    };
  }
  public lngLatToContainer(lnglat: [number, number]): IPoint {
    const ll = new AMap.LngLat(lnglat[0], lnglat[1]);
    const pixel = this.map.lngLatToContainer(ll);
    return {
      x: pixel.getX(),
      y: pixel.getY(),
    };
  }

  public async init(mapConfig: IMapConfig): Promise<void> {
    const { id, style, ...rest } = mapConfig;

    // tslint:disable-next-line:typedef
    await new Promise((resolve) => {
      // 异步加载高德地图
      // @see https://lbs.amap.com/api/javascript-api/guide/abc/load
      window.onLoad = (): void => {
        // @ts-ignore
        this.map = new AMap.Map(id, {
          mapStyle: style,
          viewMode: '3D',
          ...rest,
        });

        // 监听地图相机时间
        this.map.on('camerachange', this.handleCameraChanged);
        resolve();
      };

      const url: string = `https://webapi.amap.com/maps?v=${AMAP_VERSION}&key=${AMAP_API_KEY}&plugin=Map3D&callback=onLoad`;
      const jsapi: HTMLScriptElement = document.createElement('script');
      jsapi.charset = 'utf-8';
      jsapi.src = url;
      document.head.appendChild(jsapi);
    });

    this.viewport = new Viewport();
  }

  public onCameraChanged(callback: (viewport: IViewport) => void): void {
    this.cameraChangedCallback = callback;
  }

  private handleCameraChanged = (e: IAMapEvent): void => {
    const {
      fov,
      near,
      far,
      height,
      pitch,
      rotation,
      aspect,
      position,
    } = e.camera;
    const { lng, lat } = this.getCenter();

    if (this.cameraChangedCallback) {
      // resync viewport
      this.viewport.syncWithMapCamera({
        aspect,
        // AMap 定义 rotation 为顺时针方向，而 Mapbox 为逆时针
        // @see https://docs.mapbox.com/mapbox-gl-js/api/#map#getbearing
        bearing: 360 - rotation,
        far,
        fov,
        cameraHeight: height,
        near,
        pitch,
        // AMap 定义的缩放等级 与 Mapbox 相差 1
        zoom: this.map.getZoom() - 1,
        center: [lng, lat],
        offsetOrigin: [position.x, position.y],
      });

      // set coordinate system
      if (this.viewport.getZoom() > LNGLAT_OFFSET_ZOOM_THRESHOLD) {
        this.coordinateSystemService.setCoordinateSystem(
          CoordinateSystem.P20_OFFSET,
        );
      } else {
        this.coordinateSystemService.setCoordinateSystem(CoordinateSystem.P20);
      }

      this.cameraChangedCallback(this.viewport);
    }
  };
}