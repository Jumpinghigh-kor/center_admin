import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

interface ExerciseDetail {
  exercise_app_id: number;
  account_app_id: string;
  exercise_dt: string;
  member_type: string;
  exercise_jumping_id: number;
  session: string;
  intensity_level: string;
  skill_level: string;
  average_heart_rate: number;
  max_heart_rate: number;
  jumping_minute: string;
  jumping_calory: number;
  lesson: string;
  lesson_type: string;
  exercise_other_id: number;
  other_exercise_type: string;
  other_exercise_hour: number;
  other_exercise_minute: number;
  other_exercise_calory: number;
}

const ExerciseAppDetail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [exerciseJumpingData, setExerciseJumpingData] = useState<ExerciseDetail[]>([]);
  const [exerciseOtherData, setExerciseOtherData] = useState<ExerciseDetail[]>([]);


  const exerciseAppId = searchParams.get('exercise_app_id');
  
  // 운동 점핑 상세 조회
  const getExerciseJumpingDetail = async () => {
    if (!exerciseAppId) return;
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/exerciseApp/selectExerciseJumpingDetail`,
        {
          exercise_app_id: exerciseAppId
        }
      );
      
      if (response.data.result && response.data.result.length > 0) {
        setExerciseJumpingData(response.data.result);
      } else {
        setExerciseJumpingData([]);
      }
    } catch (error) {
      console.error("운동 점핑 상세 조회 오류:", error);
    }
  };

  // 운동 기타 운동 상세 조회
  const getExerciseOtherDetail = async () => {
    if (!exerciseAppId) return;
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/exerciseApp/selectExerciseOtherDetail`,
        {
          exercise_app_id: exerciseAppId
        }
      );
      
      if (response.data.result && response.data.result.length > 0) {
        setExerciseOtherData(response.data.result);
      } else {
        setExerciseOtherData([]);
      }
    } catch (error) {
      console.error("운동 기타 운동 상세 조회 오류:", error);
    }
  };

  useEffect(() => {
    getExerciseJumpingDetail();
    getExerciseOtherDetail();
  }, [exerciseAppId]);

  // 기본 정보는 첫 번째 데이터에서 가져오기
  const baseData = exerciseJumpingData.length > 0 
    ? exerciseJumpingData[0] 
    : exerciseOtherData.length > 0 
    ? exerciseOtherData[0] 
    : null;

  // 점핑 전체 소모 칼로리 계산
  const totalJumpingCalory = exerciseJumpingData.reduce((sum, item) => {
    return sum + (item.jumping_calory ? item.jumping_calory : 0);
  }, 0);

  // 기타 운동 전체 소모 칼로리 계산
  const totalOtherCalory = exerciseOtherData.reduce((sum, item) => {
    return sum + (item.other_exercise_calory ? item.other_exercise_calory : 0);
  }, 0);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">운동 상세</h2>
      </div>

      <form className="space-y-6">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                  운동 일자
                </td>
                <td className="px-4 py-3">
                  {baseData?.exercise_dt || '-'}
                </td>
                <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                  운동 회원 유형
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-6">
                    {baseData?.member_type}
                  </div>
                </td>
              </tr>

              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                  점핑 전체 소모 칼로리
                </td>
                <td className="px-4 py-3">
                  {totalJumpingCalory.toLocaleString()} kcal
                </td>
                <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                  기타 운동 전체 소모 칼로리
                </td>
                <td className="px-4 py-3">
                  {totalOtherCalory.toLocaleString()} kcal
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 점핑 운동 상세 */}
        {exerciseJumpingData.length > 0 && (
          <div className="mt-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold mb-4">점핑 운동 상세</h3>
              <p className="text-sm">총 {exerciseJumpingData.length}건</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-3 text-center font-semibold border-b">번호</th>
                    <th className="px-4 py-3 text-center font-semibold border-b">세션</th>
                    <th className="px-4 py-3 text-center font-semibold border-b">강도 레벨</th>
                    <th className="px-4 py-3 text-center font-semibold border-b">숙련도 레벨</th>
                    <th className="px-4 py-3 text-center font-semibold border-b">평균 심박수</th>
                    <th className="px-4 py-3 text-center font-semibold border-b">최대 심박수</th>
                    <th className="px-4 py-3 text-center font-semibold border-b">점핑 운동 시간</th>
                    <th className="px-4 py-3 text-center font-semibold border-b">수업 차수(수업강사용)</th>
                    <th className="px-4 py-3 text-center font-semibold border-b">수업 유형</th>
                    <th className="px-4 py-3 text-center font-semibold border-b">소모 칼로리</th>
                  </tr>
                </thead>
                <tbody>
                  {exerciseJumpingData.map((item, index) => (
                    item.exercise_jumping_id && (
                      <tr key={item.exercise_jumping_id} className="border-b border-gray-200">
                        <td className="px-4 py-3 text-center">{exerciseJumpingData.length - index}</td>
                        <td className="px-4 py-3 text-center">{item.session ? item.session : '-'}세션</td>
                        <td className="px-4 py-3 text-center">{item.intensity_level == 'LOW' ? '저강도' : item.intensity_level == 'MODERATE' ? '중강도' : item.intensity_level == 'HIGH' ? '고강도' : '-'}</td>
                        <td className="px-4 py-3 text-center">
                          {item.skill_level == 'BEGINNER' ? '초급회원' 
                          : item.skill_level == 'EXPERIENCED' ? '고급회원'
                          : item.skill_level == 'INSTRUCTOR' ? '강사회원' 
                          : item.skill_level == 'INTERMEDIATE' ? '중급회원'
                          : item.skill_level == 'ADVANCED' ? '어드밴스드'
                          : item.skill_level == 'BASIC' ? '베이직'
                        : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">{item.average_heart_rate ? item.average_heart_rate + ' bpm' : '미기록'}</td>
                        <td className="px-4 py-3 text-center">{item.max_heart_rate ? item.max_heart_rate + ' bpm' : '미기록'}</td>
                        <td className="px-4 py-3 text-center">{item.jumping_minute ? item.jumping_minute : '0'}분</td>
                        <td className="px-4 py-3 text-center">
                          {item.lesson == 'AM_FIRST_CLASS' ? '오전 첫수업'
                          : item.lesson == 'PM_FIRST_CLASS' ? '오후 첫수업'
                          : item.lesson == 'AM_TWO_OVER_CLASS' ? '오전 2회 이상 수업'
                          : item.lesson == 'PM_TWO_OVER_CLASS' ? '오후 2회 이상 수업' : '-'}</td>
                        <td className="px-4 py-3 text-center">{item.lesson_type == 'DANCE_FOCUSED' ? '안무 중심' : item.lesson_type == 'JUMPING_FOCUSED' ? '점핑 동작 중심' : '-'}</td>
                        <td className="px-4 py-3 text-center">{item.jumping_calory ? `${item.jumping_calory.toLocaleString()} kcal` : '-'}</td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 기타 운동 상세 */}
        {exerciseOtherData.length > 0 && (
          <div className="mt-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold mb-4">기타 운동 상세</h3>
              <p className="text-sm">총 {exerciseOtherData.length}건</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-3 text-center font-semibold border-b">번호</th>
                    <th className="px-4 py-3 text-center font-semibold border-b">운동 유형</th>
                    <th className="px-4 py-3 text-center font-semibold border-b">운동 시간</th>
                    <th className="px-4 py-3 text-center font-semibold border-b">소모 칼로리</th>
                  </tr>
                </thead>
                <tbody>
                  {exerciseOtherData.map((item, index) => (
                    item.exercise_other_id && (
                      <tr key={item.exercise_other_id} className="border-b border-gray-200">
                        <td className="px-4 py-3 text-center">{exerciseOtherData.length - index}</td>
                        <td className="px-4 py-3 text-center">
                          {item.other_exercise_type == 'RUNNING' ? '러닝'
                          : item.other_exercise_type == 'SPINNING' ? '스피닝'
                          : item.other_exercise_type == 'SWIMMING' ? '수영'
                          : item.other_exercise_type == 'CYCLING' ? '자전거'
                          : item.other_exercise_type == 'CLIMBING' ? '등산'
                          : item.other_exercise_type == 'ETC' ? '기타'
                          : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.other_exercise_hour ? item.other_exercise_hour + '시간' : ''}
                          &nbsp;{item.other_exercise_minute ? item.other_exercise_minute + '분': ''}
                        </td>
                        <td className="px-4 py-3 text-center">{item.other_exercise_calory ? `${item.other_exercise_calory.toLocaleString()} kcal` : '-'}</td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default ExerciseAppDetail;
