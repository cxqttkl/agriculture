var map;
var toolbar;
var queryfilter = {};
var currentLyr;

function showlayer(layername) {
    for (var i = 0; i < slist.length; i++) {
        if (slist[i].name == layername) {
            slist[i].layerobj.setVisibility(true);
            currentLyr = slist[i];
        } else {
            slist[i].layerobj.setVisibility(false);
        }

    }

}

function activateTool(toolstr) {

    toolbar.activate(toolstr);

}

function rowStyle(row, index) {
    var classes = ['active', 'success', 'info', 'warning', 'danger'];
    if (index % 2 === 0) {
        return {
            classes: classes[0]
        };
    } else {
        return {
            classes: classes[1]
        };
    }
}

function closeTable() {
    $('#table').bootstrapTable('destroy');
}



//需要展示的地图服务, 服务名称id+服务地址url
var slist = [
    {
        name: "安陆用地类型图-1990",
        url: "http://202.114.148.160:6080/arcgis/rest/services/anl_LU90/MapServer",
        layerobj: null
    },
    {
        name: "安陆用地类型图-1995",
        url: "http://202.114.148.160:6080/arcgis/rest/services/anl_LU95/MapServer",
        layerobj: null
    },
    {
        name: "安陆用地类型图-2000",
        url: "http://202.114.148.160:6080/arcgis/rest/services/anl_LU00/MapServer",
        layerobj: null
    }

    //"http://219.140.192.142:8399/arcgis/rest/services/TDT/TDT201607/MapServer"
];


require([
    "esri/map",
    "esri/geometry/Extent",
    "esri/SpatialReference",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/tasks/query", "esri/tasks/QueryTask",
    "esri/symbols/SimpleFillSymbol",
    "dojo/_base/array",
    "esri/Color",
    "dojo/domReady!"
], function (Map, Extent, SpatialReference, ArcGISDynamicMapServiceLayer, Query, QueryTask, SimpleFillSymbol, arrayUtils, Color) {
    map = new Map("esrimap", {
        //center: [117, 30],
        //zoom: 10,
        //basemap: "osm",
        extent: new Extent({
            xmin: 778664,
            ymin: 3325983,
            xmax: 837494,
            ymax: 3372899,
            spatialReference: {
                wkid: 2383
            }
        })
    });

    queryfilter = new Query();
    queryfilter.returnGeometry = true;
    queryfilter.outFields = ["*"];

    for (var i = 0; i < slist.length; i++) {
        var layer = new ArcGISDynamicMapServiceLayer(slist[i].url, {
            id: slist[i].name,
            className: "xq",
            visible: false
        });
        slist[i].layerobj = layer;
        slist[i].querytask = new QueryTask(slist[i].url + "/0");
        map.addLayer(layer); // adds the layer to the map 
    };


    dojo.connect(map, "onLoad", function () {

        //添加Toolbar
        require(["esri/toolbars/draw"], function (Draw) {
            toolbar = new Draw(map, {
                showTooltips: true
            });
            //alert(Draw.EXTENT);
            toolbar.on("draw-end", addToMap);
        });

        function addToMap(evt) {
            toolbar.deactivate();
            if (currentLyr && currentLyr.layerobj) {
                queryfilter.geometry = evt.geometry;
                currentLyr.querytask.execute(queryfilter,
                    function (results) {
                        console.log("queries finished: ", results);
                        // make sure both queries finished successfully
                        if (!results.hasOwnProperty("features")) {
                            console.log("query failed.");
                        }
                        // results from deferred lists are returned in the order they were created
                        // so parcel results are first in the array and buildings results are second
                        var lands = results.features;

                        map.graphics.clear();

                        var tableCol = [];
                        var tableData = [];


                        // for column of table
                        arrayUtils.forEach(results.fields, function (f) {
                            tableCol.push({
                                field: f.name,
                                title: f.alias
                            });
                        });

                        // add the results to the map
                        arrayUtils.forEach(lands, function (feat) {
                            tableData.push(feat.attributes);
                            feat.setSymbol(
                                new SimpleFillSymbol()
                                .setColor(new Color([255, 0, 255, 0.5]))
                                .setOutline(null)
                            );
                            map.graphics.add(feat);
                        });

                        //将最后的结果展示到表格中
                        $('#table').bootstrapTable({
                            columns: tableCol,
                            data: tableData
                        });
                        $('#table').bootstrapTable('load', tableData);

                    },
                    function (error) {
                        alert("请求失败或出现其他错误，未返回正确结果！" + error.toString())
                    });
            }

            //后面的代码其实没什么用
            var str = "";
            switch (evt.geometry.type) {
            case "point":
                str = evt.geometry.x.toString() + ", " + evt.geometry.y.toString();
                break;
            case "extent":
                str = evt.geometry.getHeight().toString() + ", " + evt.geometry.getWidth().toString();
                break;
            case "polyline":
                symbol = new SimpleLineSymbol();
                break;
            default:
                break;
            }
            //alert(str);
        }



    });





});