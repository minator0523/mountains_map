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
        data: './data/rail.geojson',
      },
      //高速道路
      highway :{
        type: 'geojson',
        data: './data/highway.geojson'
      },
      /*
      高速道路のセクション
      highway_section: {
        type: 'geojson',
        data: './data/N06-23_HighwaySection.geojson'
      }
      */
     geology: {
        type: 'raster',
        tiles: ['https://gbank.gsj.jp/seamless/v2/api/1.2.1/tiles/{z}/{y}/{x}.png?layer=glf'],
        tileSize: 256,
        attribution: "地図の出典：<a href='https://gbank.gsj.jp/seamless/' target='_blank'>20万分の1日本シームレス地質図V2（©産総研地質調査総合センター）</a>",
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
            ['==', ['get', '事業者種別'], '5'], '#aa00ff', //purple
            ['==', ['get', '事業者種別'], '4'], '#ffaa00', //orange
            ['==', ['get', '事業者種別'], '3'], '#ff0000', //red
            ['==', ['get', '事業者種別'], '2'], '#00f', //blue
            ['==', ['get', '事業者種別'], '1'], 'green',
            '#000000',
          ],
          //'line-width': 5,
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            10.0,
            5.0,
          ],
          'line-opacity': [
            'case',
            [ '==', ['get', '事業者種別'], '1'], 1.0,
            0.75,
          ],
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
          'line-color': 'blueviolet',
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            10.0,
            5.0,
          ],
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            1.0,
            0.7,
          ],
        },
        layout: {
          visibility: 'none',
          'line-cap': 'round',
        },
      },
      /*
      高速道路のセクションデータ
      {
        id: 'section',
        type: 'circle',
        minzoom: 12,
        source: 'highway_section',
        paint: {
          'circle-color': 'red',
        },
        layout: {
          visibility: 'none',
        },
      },
      */
      {
        id: 'geology',
        type: 'raster',
        source: 'geology',
        layout: {
          visibility: 'none',
        },
        paint: {'raster-opacity': 0.5},
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
    closeButton: true,         
    maxWidth: "1000px",
    className: 'popup'// 閉じるボタンの表示
  })
    .setLngLat(coordinates)
    .setHTML(popup_str)
    .addTo(map);
});


// 鉄道のラインをクリックしたら，アラートで事業者名と路線名を表示
// map.on()の２つ目の引数はid
map.on('click', 'rail', (e) => {
  var company = e.features[0].properties.運営会社;
  var name = e.features[0].properties.路線名;
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


// <<=========================================================>> //
// 高速道路のhovor効果
map.on('mousemove', 'road', (e) => {
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
// <<=========================================================>> //

// <<=========================================================>> //
// 鉄道のhovor効果
map.on('mousemove', 'rail', (e) => {
  if (e.features.length > 0) {
    if (hoveredStateId) {
        map.setFeatureState(
            {source: 'rail', id: hoveredStateId},
            {hover: false}
        );
    }
    hoveredStateId = e.features[0].id;
    map.setFeatureState(
        {source: 'rail', id: hoveredStateId},
        {hover: true}
    );
  }
});


map.on('mouseleave', 'rail', () => {
  if (hoveredStateId) {
    map.setFeatureState(
        {source: 'rail', id: hoveredStateId},
        {hover: false}
    );
  }
  hoveredStateId = null;
});
// <<=========================================================>> //

// <<=========================================================>> //
// クリック地点の地質情報の表示
map.on('click', function (e) {
    let element = document.getElementById('geology');
    result = element.checked;
    // elementにchackボタンの値を代入
    // resultはチェック済みならTrue

    if( result ){
      // シームレス地質図のレイヤー表示時
      const lat = e.lngLat.lat;
      const lng = e.lngLat.lng;

      // 経緯度表示
      var src = 'https://gbank.gsj.jp/seamless/v2/api/1.2.1/legend.json?point=' + lat + ',' + lng;
      fetch(src)
      .then((response) => {
        return response.text();
      })
      .then((text) => {
        var data = JSON.parse(text);
        var titulo = data.title;
        var symbol =  data.symbol; //凡例記号（文字列）
        var age = data.formationAge_ja;
        var group = data.group_ja; //大区分
        var rock = data.lithology_ja; //岩相

        popup_str = "年代：" + age + "<br>大区分：" + group + "<br>岩相：" + rock;
        // ポップアップを表示する
        new maplibregl.Popup({
          offset: 10, // ポップアップの位置
          closeButton: true, // 閉じるボタンの表示
          maxWidth: "1000px",
          className: 'popup',
        })
        .setLngLat([lng, lat])
        .setHTML(popup_str)
        .addTo(map);
      });
    }
});
// <<=========================================================>> //