export const getKeywords = ({ clients = [], searchDate }: any) => {
  const allKeywords: any = [];

  clients.forEach((client: any) => {
    const { keywords = {}, dominios = {}, competidores } = client.servicios.tracking;
    if (!!Object.keys(keywords)?.length && !!Object.keys(dominios).length) {
      Object.values(keywords).forEach((keyword: any) => {
        if (keyword.activo && !keyword.eliminado) {
          allKeywords.push({
            ...keyword,
            client,
            dominios,
            competidores
          });
        }
      });
    }
  });

  const keywords = allKeywords.filter(({ done }: any) => !done);

  const keywordsDoneWithoutResults = allKeywords.filter(({ done, results }: any) => done && results?.new?.id_date === searchDate && !results?.new?.first_position);
  const keywordsDoneList = allKeywords.filter(({ done, results }: any) => done && results?.new?.id_date === searchDate);
  const keywordsDone = keywordsDoneList.reduce((result: any, keyword: any) => ({ ...result, [keyword.id_keyword]: { results: keyword.results } }), {});
  return { keywords: keywords, allKeywords, keywordsDoneWithoutResults, keywordsDone };
};

export const filterActivesDomains = (domains = {}) => Object.values(domains).filter(({ status, valor }: any) => status === 'activo' && !!valor?.trim());
