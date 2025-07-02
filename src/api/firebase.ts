import 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, child, get, update, query, orderByChild, equalTo } from 'firebase/database';
import { getKeywords } from '@/ui/utils/functions';

var config = {
  apiKey: 'AIzaSyA8xkfV1UBy4zwlTO38Zz4eiPOkzGoqH40',
  authDomain: 'seo-yoseo-8f968.firebaseapp.com',
  databaseURL: 'https://seo-yoseo-8f968.firebaseio.com',
  projectId: 'seo-yoseo-8f968',
  storageBucket: 'seo-yoseo-8f968.appspot.com',
  messagingSenderId: '795844045699',
  appId: '1:795844045699:web:d81415fb71ed0b5d'
};

// Inicializar Firebase
const app = initializeApp(config);
const database = getDatabase(app);
const dbRef = ref(database);

export const getClients = async () => {
  var clients: any = [];

  try {
    const clientesRef = query(child(dbRef, 'Clientes'), orderByChild('activo'), equalTo(true));
    const snapshot = await get(clientesRef);
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        try {
          const { eliminado, servicios } = data;
          if (!eliminado && servicios?.tracking?.activo) {
            clients.push(data);
          }
        } catch (error) {
          // Ignora errores
        }
      });
    }
    return clients;
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return [];
  }

  /*await db
    .child('Clientes')
    .orderByChild('activo')
    .equalTo(true)
    .once('value', (snapshot) => {
      snapshot.forEach((data) => {
        var { eliminado, servicios } = data.val();
        try {
          if (!eliminado && servicios.tracking.activo) {
            clients.push(data.val());
          }
        } catch (error) {}
      });
    });
  return clients;*/
};

export const getTrackingDate = async () => {
  try {
    const trackingDateRef = child(dbRef, 'Servicios/Tracking/date_scraping');

    const snapshot = await get(trackingDateRef);

    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      console.log('No hay fecha de tracking disponible');
      return null;
    }
  } catch (error) {
    console.error('Error al obtener fecha de tracking:', error);
    return null;
  }
};

export const setTrackingDate = async (date: string) => {
  let multiPath: any = {};
  multiPath[`Servicios/Tracking/date_scraping`] = date;
  await update(dbRef, multiPath);
};

export const resetData = async (searchDate: string) => {
  let multiPath: any = {};
  multiPath[`Servicios/Tracking/date_scraping`] = searchDate;
  //Obtenemos los clientes por si hay nuevos
  const clients = await getClients();
  const { allKeywords } = getKeywords({ clients, searchDate });
  for (let i = 0; i < allKeywords.length; i++) {
    const { activo, eliminado, id_keyword, client } = allKeywords[i];
    if (activo && !eliminado) {
      multiPath[`Clientes/${client.id_cliente}/servicios/tracking/keywords/${id_keyword}/done`] = false;
    }
  }
  await update(dbRef, multiPath);
};

export const resetKeywordToDone = async ({ id_cliente, id_keyword }: { id_cliente: string; id_keyword: string }) => {
  let multiPath: any = {};
  multiPath[`Clientes/${id_cliente}/servicios/tracking/keywords/${id_keyword}/done`] = false;
  return await update(dbRef, multiPath);
};

export const resetKeywords = async (keywords: any[]) => {
  let multiPath: any = {};
  keywords.forEach((keyword) => {
    multiPath[`Clientes/${keyword.client.id_cliente}/servicios/tracking/keywords/${keyword.id_keyword}/done`] = false;
  });
  return await update(dbRef, multiPath);
};

export const uploadResults = async ({ searchDate, id_keyword, keyword, client, clientUrls, competitorsUrls, results }: any) => {
  try {
    let multiPath: any = {};

    const newResults = {
      all_positions: clientUrls,
      first_position: clientUrls?.[0]?.posicion ?? false,
      first_url: clientUrls?.[0]?.url ?? false,
      competidores: competitorsUrls
    };

    multiPath[`Servicios/Tracking/Resultados/clientes/${client.id_cliente}/${id_keyword}/keyword`] = keyword;
    multiPath[`Servicios/Tracking/Resultados/clientes/${client.id_cliente}/${id_keyword}/dates/${searchDate}`] = {
      id_date: searchDate,
      image: '',
      keyword,
      results: newResults,
      timestamp: Date.now()
    };
    multiPath[`Clientes/${client.id_cliente}/servicios/tracking/keywords/${id_keyword}/done`] = true;

    const _results = {
      previous: results.new,
      new: {
        ...newResults,
        id_date: searchDate,
        image: ''
      }
    };
    multiPath[`Clientes/${client.id_cliente}/servicios/tracking/keywords/${id_keyword}/results`] = _results;

    await update(dbRef, multiPath);
    return { ok: true, newResults: _results };
  } catch (error) {
    console.error('ERROR AL ACTUALIZAR KEYWORD:', error);
    return { ok: false };
  }
};

const firebaseCompat = {
  app,
  database: () => ({
    ref: () => dbRef
  })
};

export default firebaseCompat;
