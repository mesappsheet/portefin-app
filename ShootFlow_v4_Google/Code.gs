/**
 * SHOOTFLOW V4.0 - GOOGLE NATIVE ORCHESTRATOR
 * Orchestrates Gemini 1.5 Pro, Imagen 3, and Google Veo.
 */

const CONFIG = {
  FOLDER_INPUT: 'ID_DOSSIER_A_TRAITER', // Replace with your Drive Folder ID
  FOLDER_OUTPUT: 'ID_DOSSIER_LIVRABLES', // Replace with your Drive Folder ID
  SHEET_LOG: 'Historique',
  GOOGLE_CLOUD_PROJECT: 'VOTRE_ID_PROJET', // Replace with your GCP Project ID
  LOCATION: 'us-central1' // Vertex AI Location
};

/**
 * Main execution function
 */
function executeShootFlow() {
  const folder = DriveApp.getFolderById(CONFIG.FOLDER_INPUT);
  const files = folder.getFiles();

  while (files.hasNext()) {
    let file = files.next();
    console.log('Processing file: ' + file.getName());
    
    try {
      // ÉTAPE 1 : Analyse & Prompts via Gemini 1.5 Pro
      let aiResponse = callGeminiPro(file.getBlob());
      if (!aiResponse) continue;

      // ÉTAPE 2 : Génération Image via Imagen 3
      let generatedImageBlob = callImagen3(aiResponse.imagen_prompt, file.getBlob());

      // ÉTAPE 3 : Génération Vidéo via Google Veo
      let generatedVideoBlob = callVeo(aiResponse.veo_prompt, generatedImageBlob);

      // ÉTAPE 4 : Livraison & Log
      deliverAssets(file.getName(), generatedImageBlob, generatedVideoBlob);
      logSuccess(file.getName(), aiResponse);
      
      // OPTIONNEL : Déplacer le fichier traité
      // file.moveTo(DriveApp.getFolderById('ID_DOSSIER_ARCHIVE'));
      
    } catch (e) {
      console.error('Error processing ' + file.getName() + ': ' + e.toString());
    }
  }
}

/**
 * Calls Gemini 1.5 Pro for analysis and prompt generation via Vertex AI
 */
function callGeminiPro(blob) {
  const url = `https://${CONFIG.LOCATION}-aiplatform.googleapis.com/v1/projects/${CONFIG.GOOGLE_CLOUD_PROJECT}/locations/${CONFIG.LOCATION}/publishers/google/models/gemini-1.5-pro:generateContent`;
  
  const systemInstruction = "Tu es l'orchestrateur central de ShootFlow v4.0. Analyse l'image et génère les prompts Imagen 3 et Veo en format JSON.";
  
  const payload = {
    contents: [{
      role: "user",
      parts: [
        { text: "Analyse cet image produit et génère les prompts pour Imagen 3 et Veo." },
        { inline_data: { mime_type: blob.getContentType(), data: Utilities.base64Encode(blob.getBytes()) } }
      ]
    }],
    system_instruction: { parts: [{ text: systemInstruction }] },
    generationConfig: { 
      response_mime_type: "application/json",
      temperature: 0.2
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    payload: JSON.stringify(payload)
  };

  const response = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(response.getContentText());
  
  try {
    return JSON.parse(json.candidates[0].content.parts[0].text);
  } catch (e) {
    console.error('Failed to parse Gemini JSON: ' + json.candidates[0].content.parts[0].text);
    return null;
  }
}

/**
 * Calls Imagen 3 via Vertex AI
 */
function callImagen3(prompt, originalImageBlob) {
  const url = `https://${CONFIG.LOCATION}-aiplatform.googleapis.com/v1/projects/${CONFIG.GOOGLE_CLOUD_PROJECT}/locations/${CONFIG.LOCATION}/publishers/google/models/imagen-3.0:predict`;
  
  const payload = {
    instances: [{ prompt: prompt }],
    parameters: {
      sampleCount: 1,
      aspectRatio: "1:1"
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    payload: JSON.stringify(payload)
  };

  const response = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(response.getContentText());
  
  // Note: Imagen 3 returns base64 in predictions[0].bytesBase64Encoded
  const base64Image = json.predictions[0].bytesBase64Encoded;
  return Utilities.newBlob(Utilities.base64Decode(base64Image), 'image/png', 'generated_image.png');
}

/**
 * Calls Google Veo via Vertex AI
 */
function callVeo(prompt, imageBlob) {
  const url = `https://${CONFIG.LOCATION}-aiplatform.googleapis.com/v1/projects/${CONFIG.GOOGLE_CLOUD_PROJECT}/locations/${CONFIG.LOCATION}/publishers/google/models/veo:generateVideo`;
  
  const payload = {
    prompt: prompt,
    image: Utilities.base64Encode(imageBlob.getBytes())
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    payload: JSON.stringify(payload)
  };

  const response = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(response.getContentText());
  
  // Logic depends on Veo API response structure (currently in preview)
  const base64Video = json.predictions[0].bytesBase64Encoded;
  return Utilities.newBlob(Utilities.base64Decode(base64Video), 'video/mp4', 'generated_video.mp4');
}

/**
 * Saves assets to Drive
 */
function deliverAssets(originalName, imageBlob, videoBlob) {
  const outputFolder = DriveApp.getFolderById(CONFIG.FOLDER_OUTPUT);
  const subFolder = outputFolder.createFolder('Result_' + originalName);
  
  subFolder.createFile(imageBlob.setName(originalName + '_HD.png'));
  subFolder.createFile(videoBlob.setName(originalName + '_ANIM.mp4'));
}

/**
 * Logs success to Google Sheet
 */
function logSuccess(fileName, aiConfig) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_LOG) || ss.insertSheet(CONFIG.SHEET_LOG);
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Date', 'File Name', 'Product Type', 'Imagen Prompt', 'Veo Prompt']);
  }
  
  sheet.appendRow([
    new Date(),
    fileName,
    aiConfig.product_type,
    aiConfig.imagen_prompt,
    aiConfig.veo_prompt
  ]);
}

