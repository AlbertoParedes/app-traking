import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getClients, getTrackingDate, resetData, resetKeywords, resetKeywordToDone, setTrackingDate, uploadResults } from '@/api/firebase';
import { filterActivesDomains, getKeywords } from '@/ui/utils/functions';
import { Button, DatePicker, Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Select, SelectItem, Divider } from '@heroui/react';
import { Actions, Container, Footer, Info, InfoActions, InfoContainer, InputDate, LeftContent, PositionContainer, RightContent, TableContent, Title } from './App.styled';
import { parseDate, getLocalTimeZone, today } from '@internationalized/date';
import Settings from '@/ui/assets/svg/Settings';
import _ from 'lodash';
import Trash from '@/ui/assets/svg/Trash';
export const animals = [
  { key: 'cat', label: 'Cat' },
  { key: 'dog', label: 'Dog' },
  { key: 'elephant', label: 'Elephant' },
  { key: 'lion', label: 'Lion' },
  { key: 'tiger', label: 'Tiger' },
  { key: 'giraffe', label: 'Giraffe' },
  { key: 'dolphin', label: 'Dolphin' },
  { key: 'penguin', label: 'Penguin' },
  { key: 'zebra', label: 'Zebra' },
  { key: 'shark', label: 'Shark' },
  { key: 'whale', label: 'Whale' },
  { key: 'otter', label: 'Otter' },
  { key: 'crocodile', label: 'Crocodile' }
];

function App() {
  const [allKeywords, setAllKeywords] = useState([]);
  const [filteredKeywords, setFilteredKeywords] = useState([]);
  const [completedKeywords, setCompletedKeywords] = useState<any>({});
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [searchDate, setSearchDate] = useState<string | undefined>();
  const [dateValue, setDateValue] = useState<any>();
  const [newDateValue, setNewDateValue] = useState<any>();
  const [showModalDate, setShowModalDate] = useState(false);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'init' | 'running'>('init');
  const [keywordToDeleteResult, setKeywordToDeleteResult] = useState<{ id_cliente: string; id_keyword: string } | undefined>();
  const [showModalDeleteResult, setShowModalDeleteResult] = useState(false);
  const [showModalDeleteResultsSelected, setShowModalDeleteResultsSelected] = useState(false);
  const [clients, setClients] = useState([]);
  const [keywordsSelectedRows, setKeywordsSelectedRows] = useState('all');

  const isRunningRef = useRef(false);
  const rowsPerPage = 50;

  const pages = Math.ceil(filteredKeywords.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredKeywords
      .map((keyword: any) => ({
        ...keyword,
        results: completedKeywords?.[keyword.id_keyword]?.results ?? keyword.results,
        done: !!completedKeywords?.[keyword.id_keyword]
      }))
      .slice(start, end);
  }, [page, filteredKeywords, completedKeywords]);

  const fetchData = async () => {
    setIsLoading(true);

    const clients = await getClients();
    const searchDate = await getTrackingDate();
    const sortedClients: any = _.orderBy(clients ?? [], ['dominio'], ['asc']);

    setSearchDate(searchDate);
    setDateValue(parseDate(searchDate));
    setClients(sortedClients);

    const { allKeywords, keywords, keywordsDoneWithoutResults, keywordsDone } = getKeywords({ clients, searchDate });
    setCompletedKeywords(keywordsDone);
    setAllKeywords(allKeywords);
    //setFilteredKeywords(allKeywords);
    setIsLoading(false);
  };

  const handleChangeDate = (date: any) => {
    if (date && dateValue && date.toString() !== dateValue.toString()) {
      setNewDateValue(date);
      setShowModalDate(true);
    }
  };

  const handleCloseDateModal = () => {
    setNewDateValue(undefined);
    setShowModalDate(false);
  };

  const handleCloseDeleteResultModal = () => {
    setKeywordToDeleteResult(undefined);
    setShowModalDeleteResult(false);
  };

  const handleCloseDeleteResultsSelectedModal = (resetSelectedKeys?: boolean) => {
    if (resetSelectedKeys) {
      setSelectedKeys(new Set());
    }
    setShowModalDeleteResultsSelected(false);
  };

  const handleSaveDate = async () => {
    if (newDateValue) {
      setIsLoading(true);
      const formattedDate = newDateValue.toString();
      await resetData(formattedDate);
      await fetchData();
      setNewDateValue(undefined);
      setShowModalDate(false);
    }
  };

  const getKeywordsToTrack = () => {
    if (!selectedKeys || selectedKeys.size === 0) {
      return [];
    }
    const selectedKeywords = filteredKeywords.filter((keyword: any) => selectedKeys.has(keyword.id_keyword) && !completedKeywords?.[keyword.id_keyword]);
    return selectedKeywords;
  };

  const searchKeywords = async () => {
    const keywords = getKeywordsToTrack();

    isRunningRef.current = true;

    for (let i = 0; i < keywords.length; i++) {
      if (!isRunningRef.current) break;
      const { keyword, dominios, competidores, id_keyword, results, client }: any = keywords[i];
      console.log(`${i + 1} / ${keywords.length}: ${keyword}`);
      const domains = filterActivesDomains(dominios);
      const competitorDomains = filterActivesDomains(competidores);
      //const domains = [{ id: '-LlH6O10k81KNJSIgOg5', status: 'activo', valor: 'seo-madrid.com' }];
      if (domains.length) {
        console.log(` 🤖`);
        const { clientUrls, competitorsUrls, ok } = await window.electron.sendKeyword({ keyword, domains, competitorDomains });
        console.log(` ✅`);
        if (!isRunningRef.current) break;
        if (ok) {
          const payload = { id_keyword, keyword, results, client, clientUrls, competitorsUrls, searchDate };
          const { ok, newResults }: any = await uploadResults(payload);
          console.log(` 💾`);
          if (ok) {
            setCompletedKeywords((keywords: any) => ({ ...keywords, [id_keyword]: { results: newResults } }));
          }
        }
      } else {
        console.log(` ❌ Sin dominios`);
      }
    }
    setStatus('init');
  };

  const handleSelecction = (selected: any) => {
    if (selected === 'all') {
      const allIds = new Set(filteredKeywords.map((keyword: any) => keyword.id_keyword));
      setSelectedKeys(allIds);
    } else {
      setSelectedKeys(selected);
    }
  };

  const handleDelete = (id_keyword: string, id_cliente: string) => {
    setKeywordToDeleteResult({ id_keyword, id_cliente });
    setShowModalDeleteResult(true);
  };

  const handleDeleteKeyword = async () => {
    setIsLoading(true);
    if (keywordToDeleteResult) {
      await resetKeywordToDone(keywordToDeleteResult);
      setCompletedKeywords((keywords: any) => {
        const newKeywords = { ...keywords };
        delete newKeywords[keywordToDeleteResult.id_keyword];
        return newKeywords;
      });
      handleCloseDeleteResultModal();
    }
    setIsLoading(false);
  };

  const handleDeleteKeywordsSelected = async () => {
    setIsLoading(true);
    const keywords: any[] = allKeywords.filter((keyword: any) => selectedKeys.has(keyword.id_keyword));
    if (keywords.length) {
      await resetKeywords(keywords);
      setCompletedKeywords((_keywords: any) => {
        const newKeywords = { ..._keywords };
        keywords.forEach((keyowrd) => {
          delete newKeywords[keyowrd.id_keyword];
        });
        return newKeywords;
      });
      handleCloseDeleteResultsSelectedModal(false);
    }
    setIsLoading(false);
  };

  const handleSelectionChange = (e: any) => {
    setKeywordsSelectedRows(e.target.value);
  };

  const handleFilterTable = () => {
    let keywords: any = [];
    if (keywordsSelectedRows === 'all') {
      keywords = allKeywords;
    } else if (keywordsSelectedRows === 'keywords_without_results') {
      keywords = allKeywords.filter(({ id_keyword }) => !completedKeywords?.[id_keyword]);
    } else if (keywordsSelectedRows === 'keywords_out_range') {
      keywords = allKeywords.filter(({ id_keyword }) => completedKeywords?.[id_keyword] && !completedKeywords?.[id_keyword]?.results?.new?.first_url);
    } else {
      keywords = allKeywords.filter(({ client }: any) => client.id_cliente === keywordsSelectedRows);
    }
    setFilteredKeywords(keywords);
    setSelectedKeys(new Set());
  };

  useLayoutEffect(() => {
    allKeywords.length > 0 && handleFilterTable();
  }, [allKeywords, keywordsSelectedRows]);

  useEffect(() => {
    status === 'init' && (isRunningRef.current = false);
    status === 'running' && searchKeywords();
  }, [status]);

  useLayoutEffect(() => {
    fetchData();
  }, []);

  return (
    <Container>
      <Title>YoSEO Tracking</Title>
      <Actions>
        <LeftContent>
          {status === 'init' && (
            <Button color="success" size="sm" onPress={() => setStatus('running')}>
              Run
            </Button>
          )}
          {status === 'running' && (
            <Button color="danger" size="sm" onPress={() => setStatus('init')}>
              Stop
            </Button>
          )}
          <InputDate>
            <DatePicker className="max-w-[182px]" labelPlacement={'outside'} value={dateValue} size="sm" onChange={handleChangeDate} minValue={searchDate ? parseDate(searchDate) : today(getLocalTimeZone())} />
          </InputDate>
        </LeftContent>
        <RightContent>
          <Select disableSelectorIconRotation className="max-w-xs" onChange={handleSelectionChange} selectedKeys={[keywordsSelectedRows]} isDisabled={status === 'running'}>
            <>
              <SelectItem key={'all'}>Todas las keywords</SelectItem>
              <SelectItem key={'keywords_without_results'}>Keywords sin resultados</SelectItem>
              <SelectItem key={'keywords_out_range'}>Keywords con resultados +100</SelectItem>
              <SelectItem key={'divider'} textValue="---" className="pointer-events-none opacity-50">
                <Divider />
              </SelectItem>

              {clients.map((client: any) => (
                <SelectItem key={client.id_cliente}>{client.dominio}</SelectItem>
              ))}
            </>
          </Select>
        </RightContent>
      </Actions>
      <InfoContainer>
        <Info>
          <Chip variant="dot" color="secondary">
            Total: {allKeywords.length}
          </Chip>
          <Chip variant="dot" color="success">
            Completadas: {Object.keys(completedKeywords).length}
          </Chip>
          <Chip variant="dot" color="default">
            Filtradas: {Object.keys(filteredKeywords).length}
          </Chip>
          {!!selectedKeys.size && (
            <Chip variant="dot" color="primary">
              Seleccionadas: {selectedKeys.size}
            </Chip>
          )}
        </Info>
        <InfoActions>
          {!!filteredKeywords.length && !!selectedKeys.size && (
            <Button size="sm" variant="faded" onPress={() => setShowModalDeleteResultsSelected(true)}>
              <Trash />
            </Button>
          )}
        </InfoActions>
      </InfoContainer>

      <TableContent>
        <Table
          aria-label="Controlled table example with dynamic content"
          selectedKeys={selectedKeys}
          selectionMode="multiple"
          onSelectionChange={handleSelecction}
          isHeaderSticky
          bottomContent={
            <Footer>
              <div className="flex w-full justify-center">
                <Pagination isCompact showControls showShadow page={page} total={pages} onChange={(page) => setPage(page)} />
              </div>
            </Footer>
          }
        >
          <TableHeader>
            <TableColumn key="keyword">Keyword</TableColumn>
            <TableColumn key="position">Position</TableColumn>
            <TableColumn key="date">Date</TableColumn>
            <TableColumn key="status">Status</TableColumn>
            <TableColumn key="settings"> </TableColumn>
          </TableHeader>
          <TableBody items={items}>
            {(item: any) => (
              <TableRow key={item.id_keyword}>
                <TableCell>{item.keyword}</TableCell>
                <TableCell>
                  <PositionContainer>
                    {item.done ? (
                      !!item?.results?.new?.all_positions?.length ? (
                        item?.results?.new?.all_positions?.map(({ posicion }: any) => (
                          <Chip radius="sm" size="sm" variant="flat">
                            {posicion}
                          </Chip>
                        ))
                      ) : (
                        <Chip radius="sm" size="sm" variant="flat">
                          +100
                        </Chip>
                      )
                    ) : (
                      '-'
                    )}
                  </PositionContainer>
                </TableCell>
                <TableCell>{!!item?.results?.new?.id_date ? item.results.new.id_date.split('-').reverse().join('/') : '-'}</TableCell>
                <TableCell>
                  <Chip radius="sm" size="sm" variant="flat" color={item.done ? 'success' : 'default'}>
                    {item.done ? 'done' : 'waiting'}
                  </Chip>
                </TableCell>
                <TableCell>
                  <Dropdown size="sm" radius="sm">
                    <DropdownTrigger>
                      <Button className="capitalize" color="default" variant="light" size="sm">
                        <Settings />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu>
                      <DropdownItem key="delete" onPress={() => handleDelete(item.id_keyword, item.client.id_cliente)}>
                        Delete result
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContent>

      <Modal backdrop={'blur'} isOpen={showModalDate} onClose={handleCloseDateModal}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Cambio de fecha</ModalHeader>
          <ModalBody>
            <p>Debe estar seguro de cambiar la fecha, ya que no podrá seleccionar un fecha anterior a la proporcionada</p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={handleCloseDateModal}>
              Cancelar
            </Button>
            <Button color="primary" onPress={handleSaveDate} isLoading={isLoading}>
              Guardar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal backdrop={'blur'} isOpen={showModalDeleteResult} onClose={handleCloseDeleteResultModal}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Eliminar resultado</ModalHeader>
          <ModalBody>
            <p>Al aceptar eliminarás el resultado de la última fecha y habilitarás la keyword para poder poder realizar una nueva búsqueda</p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={handleCloseDeleteResultModal}>
              Cancelar
            </Button>
            <Button color="primary" onPress={handleDeleteKeyword} isLoading={isLoading}>
              Eliminar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal backdrop={'blur'} isOpen={showModalDeleteResultsSelected} onClose={handleCloseDeleteResultsSelectedModal}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Eliminar {selectedKeys.size} resultados</ModalHeader>
          <ModalBody>
            <p>Al aceptar eliminarás los resultado de la última fecha y habilitarás las keywords para poder poder realizar una nueva búsqueda</p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={() => handleCloseDeleteResultsSelectedModal(false)}>
              Cancelar
            </Button>
            <Button color="primary" onPress={handleDeleteKeywordsSelected} isLoading={isLoading}>
              Eliminar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}

export default App;
