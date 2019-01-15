L.TileLayer.Base64 = L.TileLayer.extend({
  
  initialize: function (url, options) {

		if (typeof url === 'string') {
      fetch(url).then(response => {
				return response.json();
			}).then(json => {
        this._prepareLayer(json);
			}).catch(err => {
				this.fire('fetcherror', {
					error: err
				});
			})
		} else if (typeof url === 'object') {
      const t = this;
      setTimeout(function () {
				t._prepareLayer(url);
			}, 100);
		} else {
			this.fire('layererror');
		}

		return L.TileLayer.prototype.initialize.call(this, url, options);
  },

  _prepareLayer: function (tiles) {
    let maxNativeZoom = 0;
    let bounds = L.latLngBounds();
    this._base64Tiles = tiles

    for (let i = 0; i < tiles.length; i++) {
      if (tiles[i].zoom_level > maxNativeZoom) {
        maxNativeZoom = tiles[i].zoom_level;
      }
    }

    this.options.maxNativeZoom = this.options.maxNativeZoom ? this.options.maxNativeZoom : maxNativeZoom;

    for (let i = 0; i < tiles.length; i++) {
      if (tiles[i].zoom_level == maxNativeZoom) {
        const bbox = this._getTileBBOX([
          tiles[i].tile_column,
          this.options.tms ? (1 << tiles[i].zoom_level) - tiles[i].tile_row - 1 : tiles[i].tile_row,
          tiles[i].zoom_level
        ]);
        bounds.extend([
          [bbox[1], bbox[0]],
          [bbox[3], bbox[2]]
        ]);
      }
    }

    this._bounds = bounds;
    this.redraw();
    this.fire('loaded');
  },

  _getTileBBOX: function (tile) {
    /*** https://github.com/mapbox/tilebelt ***/
    const r2d = 180 / Math.PI;

    function tile2lon (x, z) {
      return (x/Math.pow(2,z)*360-180);
    }

    function tile2lon (x, z) {
      return x / Math.pow(2, z) * 360 - 180;
    }

    function tile2lat (y, z) {
      const n=Math.PI-2*Math.PI*y/Math.pow(2,z);
      return (r2d*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))));
    }

    function tileToBBOX (tile) {
      const e = tile2lon(tile[0]+1,tile[2]);
      const w = tile2lon(tile[0],tile[2]);
      const s = tile2lat(tile[1]+1,tile[2]);
      const n = tile2lat(tile[1],tile[2]);
      return [w,s,e,n];
    }

    return tileToBBOX(tile);
  },
  
  _getTileData: function (tiles, z, x, y) {
    if (tiles) {
      const tileData = tiles.find(function(tile) {
        return tile.zoom_level == z && tile.tile_column == x && tile.tile_row == y;
      });
  
      return tileData; 
    }
  },

  createTile: function (coords) {
    const tile = document.createElement("img");
    if (this.options.tms) {
      coords.y = this._globalTileRange.max.y - coords.y;
    }
    const data = this._getTileData(this._base64Tiles, coords.z, coords.x, coords.y);
    if (data && data.tile_data) {
      tile.src = "data:image/png;base64," + data.tile_data;
    } else {
      tile.src = L.Util.emptyImageUrl;
    }

    return tile;
  }
});

L.tileLayer.base64 = function (url, options) {
	return new L.TileLayer.Base64(url, options);
};