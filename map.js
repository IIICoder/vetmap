

const START_POINT = 'Саратов, 2-й станционный проезд, 6а';
var END_POINT_POS, END_POINT_ADDR, PRICE;

// Функция ymaps.ready() будет вызвана, когда
// загрузятся все компоненты API, а также когда будет готово DOM-дерево.
ymaps.ready(init);
// ===================================================================

function showMap() {
  $('#map').show();
  $('#form').hide();
  $('#blank').hide();
  console.log('showMap');
}
function showForm() {
  $('#address').val(END_POINT_ADDR);
  $('#price1').val(PRICE);
  $('#map').hide();
  $('#form').show();
  $('#blank').hide();
  console.log('showForm');
}
function showBlank() {
  if ($('#address').val() && $('#phone1').val() && $('#price1').val()) {
    $('#map').hide();
    $('#form').hide();

    $('#blank_date').text($('#date').val());
    $('#date').val('');
    $('#blank_price1').text(PRICE);
    $('#price1').val('');
    if ($('#price2').val() != 0) {
      $('#blank_price2').text($('#price2').val());
    } else {
      $('#blank_price2').text('без подъема');
    }
    $('#price2').val(0);
    $('#blank_address').text(END_POINT_ADDR);
    let dgis = "https://api.qrserver.com/v1/create-qr-code/?data=dgis://2gis.ru/search/geo/" + END_POINT_POS.replace(' ', '%2C') + "&size=100x100&format=svg";
    $('#qrcode2GIS').attr('src', dgis);

    let yam = "https://api.qrserver.com/v1/create-qr-code/?data=" + encodeURIComponent("https://yandex.ru/maps/?mode=search&text=E") + END_POINT_POS.replace(' ', '%2CN') + "&size=100x100&format=svg&qzone=3";
    $('#qrcodeYM').attr('src', yam);

    let gam = "https://api.qrserver.com/v1/create-qr-code/?data=" + encodeURIComponent("https://www.google.com/maps/search/E") + END_POINT_POS.replace(' ', '%2CN') + "&size=100x100&format=svg&qzone=3";
    $('#qrcodeGM').attr('src', gam);




    $('#address').val('');
    if ($('#address2').val() != false) {
      $('#blank_address2').text($('#address2').val() + '-й подъезд');
      $('#address2').val('');
    }
    if ($('#address3').val() != false) {
      $('#blank_address3').text($('#address3').val() + ' квартира');
      $('#address3').val('');
    }

    $('#blank_phone1').text($('#phone1').val());
    let qrTEL = "https://api.qrserver.com/v1/create-qr-code/?data=TEL:" + $('#phone1').val() + "&size=100x100&format=svg&qzone=3";
    $('#qrcodeTEL').attr('src', qrTEL);
    $('#phone1').val('');


    if ($('#phone2').val() != false) {
      $('#qrTel2DIV').show();
      let qrTEL2 = "https://api.qrserver.com/v1/create-qr-code/?data=TEL:" + $('#phone2').val() + "&size=100x100&format=svg&qzone=3";
      $('#qrcodeTEL2').attr('src', qrTEL2);
    }
    $('#blank_phone2').text($('#phone2').val());
    $('#phone2').val('');



    $('#blank').show();
    console.log('showBlank');
  } else {
    alert('Поля со звездочками (*) обязательны к заполнению!');
  }
}

function init() {

  const DELIVERY_TARIFF = 75
  const MINIMUM_COST = 400

  // Создание карты.    
  var myMap = new ymaps.Map("map", {
    // Координаты центра карты.
    // Порядок по умолчанию: «широта, долгота».
    // Чтобы не определять координаты центра карты вручную,
    // воспользуйтесь инструментом Определение координат.
    center: [51.51406057, 45.98837050],

    // Уровень масштабирования. Допустимые значения:
    // от 0 (весь мир) до 19.
    zoom: 14,
    controls: []
  });

  // --------------------------------------------------------------------
  // Создадим панель маршрутизации.
  var routePanelControl = new ymaps.control.RoutePanel({
    options: {
      // Добавим заголовок панели.
      showHeader: true,
      title: 'Расчёт доставки',
      maxWidth: '350px',
      autofocus: true,
    }
  })
  // Пользователь сможет построить только автомобильный маршрут.
  routePanelControl.routePanel.options.set({
    types: { auto: true }
  });

  // Если вы хотите задать неизменяемую точку "откуда", раскомментируйте код ниже.
  routePanelControl.routePanel.state.set({
    fromEnabled: false,
    from: START_POINT
  });
  var zoomControl = new ymaps.control.ZoomControl({
    options: {
      size: 'small',
      float: 'none',
      position: {
        bottom: 145,
        right: 10
      }
    }
  });


  // Подключение панлей
  myMap.controls.add(routePanelControl).add(zoomControl);

  let myPolygons;

  function onZonesLoad(json) {
    // Добавляем зоны на карту.
    myPolygons = ymaps.geoQuery(json).addToMap(myMap);
    // Задаём цвет и контент балунов полигонов.
    myPolygons.each(function (obj) {
      /*       let color = obj.properties.get('fill');
            let opacity = obj.properties.get('fill-opacity')
            let strokeWidth = obj.properties.get('stroke-width')
            obj.options.set({ fillColor: color, strokeColor: '#ff0000', opacity: opacity, strokeWidth: strokeWidth }); */
      obj.options.set({ opacity: 0 });
    })
  }



  // Получим ссылку на маршрут.
  routePanelControl.routePanel.getRouteAsync().then(function (route) {

    // Зададим максимально допустимое число маршрутов, возвращаемых мультимаршрутизатором.
    route.model.setParams({ results: 1 }, true);

    // Повесим обработчик на событие построения маршрута.
    route.model.events.add('requestsuccess', function () {


      var activeRoute = route.getActiveRoute();



      if (activeRoute) {
        // Находим полигон, в который входят переданные координаты.
        let coords;
        route.getWayPoints().each(wayPoint => {
          coords = wayPoint.geometry.getCoordinates();

          // адрес
          ymaps.geocode(coords, { json: true }).then(res => {
            let tmp = res.GeoObjectCollection.featureMember[0].GeoObject.name;
            if (tmp != "2-й Станционный проезд, 6А") {
              END_POINT_ADDR = tmp;
            }
          }).catch(err => console.warn(err))
          // координаты
          ymaps.geocode(coords, { json: true }).then(res => {
            let tmp = res.GeoObjectCollection.featureMember[0].GeoObject.Point.pos;
            if (tmp != '45.988371 51.514061') {
              END_POINT_POS = tmp;
            }
          }).catch(err => console.warn(err))
        })



        let polygon = myPolygons.searchContaining(coords).get(0);
        if (polygon) {
          PRICE = polygon.properties.get('description')
        } else {
          // Получим протяженность маршрута.
          let length = route.getActiveRoute().properties.get("distance")
          // Вычислим стоимость доставки.
          PRICE = calculate(Math.round(length.value / 1000))
        }

        // Создадим макет содержимого балуна маршрута.
        let balloonContentLayout = ymaps.templateLayoutFactory.createClass(
          // '<span>Расстояние: ' + length.text + '.</span>
          '<br/>' +
          '<span style="font-weight: bold; font-style: italic">Стоимость доставки: ' + PRICE + ' р.</span>' +
          '<br/>' +
          '<button onClick="showForm()">Оформить доставку</button>');
        // Зададим этот макет для содержимого балуна.
        route.options.set('routeBalloonContentLayout', balloonContentLayout);
        // Откроем балун.
        activeRoute.balloon.open();
      }
    });

  });

  // Функция, вычисляющая стоимость доставки.
  function calculate(routeLength) {
    return Math.max(routeLength * DELIVERY_TARIFF, MINIMUM_COST);
  }

  $.ajax({
    url: 'data.json',
    dataType: 'json',
    success: onZonesLoad
  });
}