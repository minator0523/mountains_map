let hoveredStateId = null;
const map = new maplibregl.Map({
  container: 'map',
  center: [138.7275, 35.36083333], // 中心座標
  zoom: 8, // ズームレベル
  style: {
    // スタイル仕様のバージョン番号。8を指定する
    version: 8,
    // データソース
    sources: {
      //地理院白地図
      blank: {
        // ソースの種類。vector、raster、raster-dem、geojson、image、video のいずれか
        type: 'raster',
        // タイルソースのURL 今回は白地図
        tiles: ['https://cyberjapandata.gsi.go.jp/xyz/blank/{z}/{x}/{y}.png'],
        // タイルの解像度。単位はピクセル、デフォルトは512
        tileSize: 256,
        // データの帰属
        attribution: "地図の出典：<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>国土地理院</a>",
      },
      // 地理院標準地図
      standard: {
        type: 'raster',
        tiles: ['https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: "地図の出典：<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>国土地理院</a>",
      },
      //鉄道
      rail :{
        type: 'geojson',
        data: './data/N02-23_RailroadSection.geojson',
      },
      //高速道路
      highway :{
        type: 'geojson',
        data: './data/highway.geojson'
      },
    },
    // 表示するレイヤ
    layers: [
      {
        // 一意のレイヤID
        id: 'blank-layer',
        // レイヤの種類。background、fill、line、symbol、raster、circle、fill-extrusion、heatmap、hillshade のいずれか
        type: 'raster',
        // データソースの指定
        source: 'blank',
      },
      {
        id: 'standard-layer',
        type: 'raster',
        source: 'standard',
        layout: {
          visibility: 'none',
        },
      },
      {
        id: 'rail',
        type: 'line',
        source: 'rail',
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'N02_002'], '1'], 'green',
            ['==', ['get', 'N02_002'], '2'], '#00f', //blue
            ['==', ['get', 'N02_002'], '3'], '#ff0000', //red
            ['==', ['get', 'N02_002'], '4'], '#ffaa00', //orange
            ['==', ['get', 'N02_002'], '5'], '#aa00ff', //purple
            '#000000',
          ],
          'line-width': 5,
          'line-opacity': 0.8,
        },
        layout: {
          visibility: 'none',
          'line-cap': 'round',
        },
      },
      {
        id: 'road',
        type: 'line',
        source: 'highway',
        paint: {
          //'line-color': '#ffaa00',
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#ffaa00',
            '#00f',
          ],
          'line-width': 5.0,
          'line-opacity': 0.8,
        },
        layout: {
          visibility: 'none',
          'line-cap': 'round',
        },
      },
    ],
  },
});

// スケール表示
map.addControl(new maplibregl.ScaleControl({
    maxWidth: 200,
    unit: 'metric'
}));
// コントロール関係表示
map.addControl(new maplibregl.NavigationControl());

//ボタンによる地図タイル切り替え
let kindRadio = document.getElementsByName('kind');
let len = kindRadio.length;
kindRadio[0].checked = true;
function buttonClick(){
  let checkValue = '';

  for (let i = 0; i < len; i++){
    checkValue = kindRadio.item(i).value + '-layer';
    if (kindRadio.item(i).checked){
      map.setLayoutProperty(checkValue, 'visibility', 'visible');
    }else{
      map.setLayoutProperty(checkValue, 'visibility', 'none');
    }
  }
}


//チェックの有無によって，レイヤーの表示・非表示を変更
let checkButton = document.getElementById('checkButton');
checkButton.addEventListener('click', buttonClick);

function changeLayerVisibility(checkbox) {
  if (checkbox.checked) {
    // チェックボックスのチェックがついた場合、レイヤを表示する
    map.setLayoutProperty(checkbox.id, "visibility", "visible");
  } else {
    // チェックボックスのチェックが外れた場合、レイヤを非表示にする
    map.setLayoutProperty(checkbox.id, "visibility", "none");
  }
}

// 主要な山頂の表示
map.on('load', async () => {
  const iconImageRed = await map.loadImage('./img/mountain_red.png');
  const iconImageGreen = await map.loadImage('./img/mountain_green.png');
  const iconImageYellow = await map.loadImage('./img/mountain_yellow.png');
  map.addImage('mountain_icon_red', iconImageRed.data);
  map.addImage('mountain_icon_green', iconImageGreen.data);
  map.addImage('mountain_icon_yellow', iconImageYellow.data);

  map.addSource('mountain_point', {
    type: 'geojson',
    data: './data/meizan.geojson',
  });
  map.addLayer({
    id: 'meizan',
    type: 'symbol',
    source: 'mountain_point',
    layout: {
      'icon-image': [
        'case',
        [ '==', ['get', '種別'], '100meizan'], 'mountain_icon_red',
        [ '==', ['get', '種別'], '200meizan'], 'mountain_icon_green',
        [ '==', ['get', '種別'], '300meizan'], 'mountain_icon_green',
        'moutain_icon_yellow'
      ],
      'icon-size': [
        'case',
        [ '==', ['get', '種別'], '100meizan'], 0.4,
        [ '==', ['get', '種別'], '200meizan'], 0.3,
        [ '==', ['get', '種別'], '300meizan'], 0.3,
        0.1
      ],
        visibility: 'none',
    },
  });
});

// 山頂のアイコンをクリックした時の挙動
// map.on()の２つ目の引数はid
map.on('click', 'meizan', (e) => {
  var coordinates = e.features[0].geometry.coordinates.slice();
  var name = e.features[0].properties.山名;
  var yomi = e.features[0].properties.よみがな;
  var altitude = e.features[0].properties.標高;
  var spiece = e.features[0].properties.種別;
 
  popup_str = "山名：" + name + "<br>よみがな：" + yomi + "<br>標高：" + altitude + " [m]";

  while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
  }
  // ポップアップを表示する
  new maplibregl.Popup({
    offset: 10, // ポップアップの位置
    closeButton: false, // 閉じるボタンの表示
  })
    .setLngLat(coordinates)
    .setHTML(popup_str)
    .addTo(map);
});


// 鉄道のラインをクリックしたら，アラートで事業者名と路線名を表示
// map.on()の２つ目の引数はid
map.on('click', 'rail', (e) => {
  var company = e.features[0].properties.N02_004;
  var name = e.features[0].properties.N02_003;
  popup_str = "事業者名：" + company + "\n路線：" + name;
  alert(popup_str);
});


// 高速道路のラインをクリックしたら，アラートで事業者名と路線名を表示
// map.on()の２つ目の引数はid
map.on('click', 'road', (e) => {
  var name = e.features[0].properties.路線名;
  //var numberLine = e.features[0].properties.車線数;
  popup_str = "路線：" + name;
  alert(popup_str);
  //console.log(hoveredStateID);
});


map.on('mousemove', 'road', (e) => {
  var name = e.features[0].properties.路線名;
  //var numberLine = e.features[0].properties.車線数;
  //popup_str = "路線：" + name + "\n車線数：" + numberLine;
  if (e.features.length > 0) {
    if (hoveredStateId) {
        map.setFeatureState(
            {source: 'highway', id: hoveredStateId},
            {hover: false}
        );
    }
    hoveredStateId = e.features[0].id;
    map.setFeatureState(
        {source: 'highway', id: hoveredStateId},
        {hover: true}
    );
    console.log(e.features[0])
  }
});

map.on('mouseleave', 'road', () => {
  if (hoveredStateId) {
    map.setFeatureState(
        {source: 'highway', id: hoveredStateId},
        {hover: false}
    );
  }
  hoveredStateId = null;
});
