require('dotenv').config();
const axios = require('axios');
const { getMxApiUrl, getMxHeaders } = require('./mx_api.js');

function createEquipmentRecord(wholegood) {
    const equipmentRecord = {
        name:wholegood.make + " " + wholegood.serialNumber,
        extraFields: Object.fromEntries(
            Object.entries({
                "Serial Number": wholegood.serialNumber,
                "Eq Make": wholegood.make,
            }).filter(([key, value]) => value != null) // Filter out null or undefined values
        ),
    }
    return equipmentRecord;
}

async function getLocationId(wholegood) {
    try{
        if (wholegood.wgUserDefinedField4) {
            const locationName = wholegood.wgUserDefinedField4;
           // console.log('Location Name from wgUserDefinedField4: ' + locationName);
            const maintainXApiUrl = getMxApiUrl(`locations?name=${encodeURIComponent(locationName)}`);
            const response = await axios.get(maintainXApiUrl, getMxHeaders());
            if (response.data.locations[0]?.id) {
               // console.log(`Found location ID ${response.data.locations[0].id} for location name "${locationName}"`);
                return response.data.locations[0].id;
            }
        }
    } catch (error){
        console.error(`Error fetching location for RIMSS ID ${wholegood.systemID}:`, error.response ? error.response.data : error.message);
    }
}

async function updateEquipment(wholegood, equipment) { 
    try{
        const updatedEquipmentRecord = createEquipmentRecord(wholegood);

        const maintainXApiUrl = getMxApiUrl(`assets/${equipment.id}`);
        const response = await axios.patch(maintainXApiUrl, updatedEquipmentRecord, getMxHeaders());
        
    } catch (error) {
        console.error(`Error updating equipment with MX ID ${equipment.id} and RIMSS ID ${wholegood.systemID}:`, error.response ? error.response.data : error.message);
    }
}

async function createEquipment(wholegood) {
    try {
        let updatedEquipmentRecord = createEquipmentRecord(wholegood);
        
        updatedEquipmentRecord.locationId = await getLocationId(wholegood);
        if (updatedEquipmentRecord.locationId) {
            console.log(`Assigned location ID ${updatedEquipmentRecord.locationId} to equipment for RIMSS ID ${wholegood.systemID}`);
        } else {
            console.log(`No location assigned for equipment with RIMSS ID ${wholegood.systemID} because no valid location was found.`);
        }
        const maintainXApiUrl = getMxApiUrl(`assets`);
        const response = await axios.post(maintainXApiUrl, updatedEquipmentRecord, getMxHeaders());
        return response.data;
    } catch (error) {
        console.error(`Error creating equipment for RIMSS ID ${wholegood.systemID}:`, error.response ? error.response.data : error.message);
    }
}

module.exports = {
    updateEquipment,
    createEquipment,
    getLocationId,
    createEquipmentRecord,
};
