export const translations = {
  nl: {
    home: {
      title: 'Boerderij Logistiek',
      log_harvest: 'Oogst Registreren',
      my_records: 'Mijn Records',
      offline_banner: 'Offline — records worden opgeslagen',
    },
    submission: {
      title: 'Registreer Oogst',
      take_photo: 'Foto maken',
      choose_gallery: 'Kies uit galerij',
      manual_fill: 'Handmatig invullen',
      product_type: 'Product Type',
      quantity: 'Hoeveelheid',
      unit: 'Eenheid',
      condition: 'Conditie',
      location: 'Locatie',
      notes: 'Opmerkingen (Optioneel)',
      submit: 'Verstuur',
      photo_unclear: 'Foto onduidelijk — vul handmatig in',
      ai_processing: 'AI analyseert foto...',
    },
    common: {
      good: 'Goed',
      mixed: 'Gemengd',
      damaged: 'Beschadigd',
      confirmed: 'Bevestigd ✓',
      pending: 'In afwachting ⏳',
      needs_review: 'Controle nodig ⚠',
      error: 'Fout',
      success: 'Succes!',
    }
  },
  en: {
    home: {
      title: 'Farm Logistics',
      log_harvest: 'Log Harvest',
      my_records: 'My Records',
      offline_banner: 'Offline — records are being queued',
    },
    submission: {
      title: 'Log Harvest',
      take_photo: 'Take Photo',
      choose_gallery: 'Choose from Gallery',
      manual_fill: 'Fill Manually',
      product_type: 'Product Type',
      quantity: 'Quantity',
      unit: 'Unit',
      condition: 'Condition',
      location: 'Location',
      notes: 'Notes (Optional)',
      submit: 'Submit',
      photo_unclear: 'Photo unclear — please fill manually',
      ai_processing: 'AI analyzing photo...',
    },
    common: {
      good: 'Good',
      mixed: 'Mixed',
      damaged: 'Damaged',
      confirmed: 'Confirmed ✓',
      pending: 'Pending ⏳',
      needs_review: 'Needs Review ⚠',
      error: 'Error',
      success: 'Success!',
    }
  },
  fr: {
    home: {
      title: 'Logistique Agricole',
      log_harvest: 'Enregistrer la récolte',
      my_records: 'Mes Dossiers',
      offline_banner: 'Hors ligne — les dossiers sont mis en file d\'attente',
    },
    submission: {
      title: 'Enregistrer la récolte',
      take_photo: 'Prendre une photo',
      choose_gallery: 'Choisir dans la galerie',
      manual_fill: 'Remplir manuellement',
      product_type: 'Type de produit',
      quantity: 'Quantité',
      unit: 'Unité',
      condition: 'Condition',
      location: 'Emplacement',
      notes: 'Notes (Optionnel)',
      submit: 'Envoyer',
      photo_unclear: 'Photo floue — veuillez remplir manuellement',
      ai_processing: 'IA analyse la photo...',
    },
    common: {
      good: 'Bon',
      mixed: 'Moyen',
      damaged: 'Endommagé',
      confirmed: 'Confirmé ✓',
      pending: 'En attente ⏳',
      needs_review: 'À vérifier ⚠',
      error: 'Erreur',
      success: 'Succès !',
    }
  }
};

export const t = (keyPath, lang = 'nl', defaultValue = '') => {
  const keys = keyPath.split('.');
  let current = translations[lang];
  for (const key of keys) {
    if (current && current[key]) {
      current = current[key];
    } else {
      return defaultValue;
    }
  }
  return current;
};
