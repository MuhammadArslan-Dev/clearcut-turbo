'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getExamInstances, getExamPYQs } from '@/lib/preparation/preparation';
import ExamInstanceCard, { ExamInstance } from '../components/cards/ExamInstanceCard';
import ExamInstanceModal from '../components/cards/ExamInstanceModal';
import PaperTabs from '@/components/ui/tabs/PaperTabs';
import { TabItem } from '@/components/ui/tabs/TabSwitch';
import CourseContentCard, { PDFCard } from '../components/cards/CourseContentCard';
import { useGetCurrentCourse } from '@/hooks/course/useGetCurrentCourse';
import { useGetCurrentCourseStore } from '@/store/course/useGetCurrentCourseStore';
import { handleOpenPaywall } from '../../PayWalls/PaywallFloatingWidget';
import { useRouter } from 'next/navigation';
import { useContentDataStore } from '../store/useContentDataStore';
import useLanguageSwitch from '@/hooks/useLanguageSwitch';
import { mapPapersToItems } from '@/lib/mapPapersToItems';

interface PYQFile {
  file: string;
  name: string;
}

interface ExamContent {
  id: number;
  type: string;
  metadata: Record<string, PYQFile[] | Record<string, PYQFile[]>>;
}

interface PYQData {
  pyqs: string[][];
  examContents: ExamContent[];
}

const PYQ_QUERY_KEY = (examId?: string | number | null) => ['pyqs', examId];

export default function PaperPage({ examId }: { examId?: string }) {
  const router = useRouter();

  useGetCurrentCourse({ courseId: examId });
  const { course } = useGetCurrentCourseStore();
  const { data, isLoading } = useQuery<PYQData>({
    queryKey: PYQ_QUERY_KEY(examId),
    enabled: !!examId,
    queryFn: async () => {
      const res = await getExamPYQs(examId as unknown as number);
      return res.data as PYQData;
    },
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const { data: instancesData, isLoading: instancesLoading } = useQuery<ExamInstance[]>({
    queryKey: ['exam-instances', examId],
    enabled: !!examId,
    queryFn: async () => {
      const res = await getExamInstances(examId);
      return res.data as ExamInstance[];
    },
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const isActive = course?.status === 'active';

  const [selectedLevel, setSelectedLevel] = React.useState<string>('0');
  const [selectedPDF, setSelectedPDF] = React.useState<string | null>(null);
  const [selectedInstance, setSelectedInstance] = React.useState<ExamInstance | null>(null);
  const { locale } = useLanguageSwitch();

  const {
    selectedPaperId,
    sectionsMap,
    papers,
    selectPaper,
    selectedSections,
    toggleSection,
    setData,
  } = useContentDataStore();

  const openInstanceModal = (instance: ExamInstance) => {
    setSelectedInstance(instance);
  };

  const handlePDFClick = (fileUrl: string, locked: boolean) => {
    if (locked) {
      handleOpenPaywall(router, 'topic_card_clicked', course);
      return;
    }
    setSelectedPDF(fileUrl);
  };
console.log("PYQ Data:", papers);


  const levelTabs: TabItem[] = React.useMemo(() => {
    if (!data?.pyqs) return [];
    return data.pyqs.map((levelArr, i) => ({
      id: String(i),
      label: levelArr[0],
    }));
  }, [data?.pyqs]);

  const items = React.useMemo(
    () => {
      return mapPapersToItems(papers, locale);
    },
    [papers, locale],
  );

  const pyqContent = data?.examContents?.find(c => c.type === 'pyq_pdf');

  // pyqs[i][0] = "Level 1 (PRT)" → key "Level 1"
  // pyqs[i][1] = subject to display (e.g. "English"), or absent for no-subject levels
  const selectedLevelArr = data?.pyqs?.[Number(selectedLevel)];
  const levelKey = selectedLevelArr
    ? selectedLevelArr[0].split(' ').slice(0, 2).join(' ')
    : null;
  const subjectFilter = selectedLevelArr?.[1] ?? null;

  const levelMetadata = levelKey && pyqContent ? pyqContent.metadata[levelKey] : null;

  let filesToShow: PYQFile[] = [];
  if (Array.isArray(levelMetadata)) {
    // No subject — show all files directly
    filesToShow = levelMetadata;
  } else if (levelMetadata && subjectFilter) {
    // Subject specified in pyqs — pick only that subject's files
    filesToShow = (levelMetadata as Record<string, PYQFile[]>)[subjectFilter] ?? [];
  }

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center py-16">
        <span className="body-medium text-surface-gray-light">Loading...</span>
      </div>
    );
  }

  if (!data || levelTabs.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center py-16">
        <span className="body-medium text-surface-gray-light">Coming Soon !</span>
      </div>
    );
  }

  return (
    <div>
      {/* {levelTabs.length > 1 && (
        <div className="bg-white sm:bg-transparent -mt-1 py-1 px-4">
          <PaperTabs
            tabs={levelTabs}
            selectedId={selectedLevel}
            onChange={(id) => setSelectedLevel(id)}
            containerBg="bg-transparent"
          />
        </div>
      )} */}
      {items?.length > 1 && (
        <div className='px-4'>
          <PaperTabs
            tabs={items}
            selectedId={selectedPaperId?.toString() ?? null}
            onChange={(id) => selectPaper(Number(id))}
            containerBg="bg-transparent"
          />
        </div>
      )}
      {/* Exam Instances Section */}
      {(instancesLoading || (instancesData && instancesData.length > 0)) && (
        <div className="p-4">
          {instancesLoading ? (
            <div className="flex items-center justify-center py-6">
              <span className="body-medium text-surface-gray-light">Loading instances...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {instancesData!.map((instance) => (
                <ExamInstanceCard
                  key={instance.id}
                  instance={instance}
                  onClick={openInstanceModal}
                />
              ))}
            </div>
          )}
        </div>
      )}



      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {filesToShow.length === 0 ? (
          <p className="py-8 text-center body-medium text-surface-gray-light col-span-2">
            Coming Soon !
          </p>
        ) : (
          filesToShow.map((item, topicIndex) => {
            const isLocked = isActive ? false : topicIndex !== 0;
            return (
              <CourseContentCard
                key={item.file}
                cardClass={{ maxWidth: 'max-w-full' }}
                mainButton={{ isShow: false, text: '', onClick: () => { } }}
                header={{ title: item.name, showIcon: true }}
                counter={{
                  value: topicIndex + 1,
                  border: 'border-2',
                  borderColor: 'border-brand',
                }}
                notes={
                  <div className="flex flex-col gap-3">
                    <PDFCard
                      id={`pyq-${topicIndex}`}
                      title="Previous Year Paper"
                      isLock={isLocked}
                      features={{ type: 'Language', value: 'English' }}
                      onClick={() => handlePDFClick(item.file, isLocked)}
                    />
                  </div>
                }
              />
            );
          })
        )}
      </div>


      {selectedInstance && (
        <ExamInstanceModal
          instance={selectedInstance}
          paperId={selectedPaperId}
          onClose={() => setSelectedInstance(null)}
        />
      )}

      {selectedPDF && (
        <div
          onClick={() => setSelectedPDF(null)}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full sm:w-[90%] h-[85%] sm:h-[90%] rounded-lg overflow-hidden relative"
          >
            <button
              onClick={() => setSelectedPDF(null)}
              className="absolute top-2 right-2 z-10 bg-white px-3 py-1 rounded shadow cursor-pointer"
            >
              ✕
            </button>
            <iframe src={selectedPDF} className="w-full h-full" title="PDF Viewer" />
          </div>
        </div>
      )}
    </div>
  );
}
