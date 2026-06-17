GEOFENCING_URLS = {
    "stuttgart": {
        "lime": "https://api.mobidata-bw.de/sharing/gbfs/v3/lime_bw/geofencing_zones",
        "bolt": "https://api.mobidata-bw.de/sharing/gbfs/v3/bolt_stuttgart/geofencing_zones",
        "voi":  "https://api.mobidata-bw.de/sharing/gbfs/v3/voi_de/geofencing_zones",
        "dott": "https://gbfs.api.ridedott.com/public/v2/stuttgart/geofencing_zones.json",
        
        "regioRadStuttgart": "https://api.mobidata-bw.de/sharing/gbfs/v3/regiorad_stuttgart/geofencing_zones",
        "dbCallABike": "https://api.mobidata-bw.de/sharing/gbfs/v3/callabike/geofencing_zones"
    },

    "karlsruhe": {
        "bolt": "https://api.mobidata-bw.de/sharing/gbfs/v3/bolt_karlsruhe/geofencing_zones",
        "voi":  "https://api.mobidata-bw.de/sharing/gbfs/v3/voi_de/geofencing_zones",
        "dott": "https://gbfs.api.ridedott.com/public/v2/karlsruhe/geofencing_zones.json",

        "kvv.nextbike": "https://gbfs.nextbike.net/maps/gbfs/v2/nextbike_fg/de/geofencing_zones.json",
        "dbCallABike": "https://api.mobidata-bw.de/sharing/gbfs/v3/callabike/geofencing_zones"
    },

    "mannheim": {
        "voi":  "https://api.mobidata-bw.de/sharing/gbfs/v3/voi_de/geofencing_zones",
        "dott": "https://gbfs.api.ridedott.com/public/v2/mannheim/geofencing_zones.json",

        "vrnnextbike": "https://gbfs.nextbike.net/maps/gbfs/v2/nextbike_vn/de/geofencing_zones.json",
        "dbCallABike": "https://api.mobidata-bw.de/sharing/gbfs/v3/callabike/geofencing_zones"
    }
}

PROVIDER_VEHICLE_TYPES = {
    "voi": "e-scooter",
    "dott": "e-scooter",
    "lime": "e-scooter",
    "bolt": "e-scooter",

    "vrnnextbike": "bike",
    "kvv.nextbike": "bike",
    "regioRadStuttgart": "bike",
    "dbCallABike": "bike",
}
