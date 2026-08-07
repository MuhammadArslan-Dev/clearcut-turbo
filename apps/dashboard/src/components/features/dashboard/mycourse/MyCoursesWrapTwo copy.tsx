'use client';

import MyCourseCard from './MyCourseCard';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Navigation, Pagination, Scrollbar } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';

export default function MyCoursesWrapTwo() {
    return (
        <section className="space-y-3">
            <div className='bg-[#0053A2] p-4 md:rounded-md flex flex-col gap-4'>
                <div className='heading-medium !font-semibold text-white'>
                    My Courses
                </div>

                {/* 📱 MOBILE: Swiper */}
                <div className="md:hidden p-4">
                    <Swiper
                        modules={[Navigation, Pagination, Scrollbar, A11y]}
                        pagination={{ clickable: true }}
                        spaceBetween={16}
                        slidesPerView={1}
                        className="p-4"
                    >
                        <SwiperSlide>
                            <MyCourseCard
                                bgColor="bg-[#0053A2]"
                                maxWidth="350px"
                                badge="active"
                                courseName="HTET"
                                examData={12}
                                rating={12}
                                topics={{
                                    title: 'Course',
                                    completed: 0,
                                    total: 12,
                                }}
                                tests={{
                                    title: 'Test Series',
                                    completed: 0,
                                    total: 12,
                                }}
                            />
                        </SwiperSlide>

                        <SwiperSlide>
                            <div className="border border-white/40 rounded-xl p-6 text-center">
                                <h3 className="text-white text-lg font-semibold mb-4">
                                    Studying for more than one exam?
                                </h3>

                                <button className="bg-white text-blue-700 px-6 py-2 rounded-full font-medium mb-3">
                                    Add Exam →
                                </button>

                                <p className="text-blue-100 text-sm">
                                    Course + Test Series • Valid till exam day <br />
                                    You can add or remove exams anytime
                                </p>
                            </div>
                        </SwiperSlide>
                    </Swiper>
                </div>

                {/* 🖥 DESKTOP: Single Card */}
                <div className="hidden md:block">
                    <MyCourseCard
                        bgColor="bg-[#0053A2]"
                        maxWidth="400px"
                        badge="active"
                        courseName="HTET"
                        examData={12}
                        rating={12}
                        topics={{
                            title: 'Course',
                            completed: 0,
                            total: 12,
                        }}
                        tests={{
                            title: 'Test Series',
                            completed: 0,
                            total: 12,
                        }}
                    />
                </div>
            </div>
        </section>
    );
}
