require('dotenv').config();
const axios = require('axios');
const { getMxApiUrl, getMxHeaders } = require('./mx_api.js');

function createEquipmentRecord(wholegood) {
    const equipmentRecord = {
        name:wholegood.make + " " + wholegood.model, 
        model: wholegood.model,
        extraFields: Object.fromEntries(
            Object.entries({
                "Serial Number": wholegood.serialNumber,
                "Eq Make": wholegood.make,
            }).filter(([key, value]) => value != null) // Filter out null or undefined values
        ),
    }
    return equipmentRecord;
}

async function updateEquipment(wholegood, equipment) { 
    try{
        // const updatedEquipmentRecord = createEquipmentRecord(wholegood);

        // const maintainXApiUrl = getMxApiUrl(`assets/${equipment.id}`);
        // const response = await axios.patch(maintainXApiUrl, updatedEquipmentRecord, getMxHeaders());
        console.log('Placeholder for updating equipment in MaintainX with MX ID:', equipment.id, 'and RIMSS ID:', wholegood.systemID);
        
    } catch (error) {
        console.error(`Error updating equipment with MX ID ${equipment.id} and RIMSS ID ${wholegood.systemID}:`, error.response ? error.response.data : error.message);
    }
}

async function createEquipment(wholegood) {
    try {
        console.log('Placeholder for creating new equipment in MaintainX for wholegood:', wholegood.systemID);
        
    } catch (error) {
        console.error(`Error creating equipment for RIMSS ID ${wholegood.systemID}:`, error.response ? error.response.data : error.message);
    }
}

module.exports = {
    updateEquipment,
    createEquipment,
};
