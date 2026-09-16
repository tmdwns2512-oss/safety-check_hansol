// URL 파라미터 감지 (center & type)
const urlParams = new URLSearchParams(window.location.search);
const centerName = urlParams.get('center') || '천안센터';
const checkType = urlParams.get('type') || 'in'; // 'in' (입차) 또는 'out' (적재후)

// 모드별 총 스텝 수 (in: 4단계, out: 2단계)
const totalSteps = checkType === 'out' ? 2 : 4;
let currentStep = 1;

// DOM Elements
const stepIndicator = document.getElementById('step-indicator');
const toastEl = document.getElementById('toast');
const loadingOverlay = document.getElementById('loadingOverlay');

const step3VehicleRender = document.getElementById('dynamicVehicleItems');
const step4CargoRender = document.getElementById('dynamicCargoItems');
const step5RulesRender = document.getElementById('dynamicRulesContainer');
const vehicleTypeLabel = document.getElementById('vehicleTypeLabel');

// State
let formData = {
    centerName: centerName,
    checkType: checkType === 'out' ? '적재후' : '입차',
    vehicleNo: "",
    vehicleType: "",
    driverName: "",
    carrierName: "",
    insp_comprehensive: "",
    insp_regular: "",
    items: [],
    finalConsent: ""
};

const rulesData = {
    COMMON_HAZARD: [
        "1. 제조, 생산시설, 물류창고의 화재 및 폭발 위험",
        "2. 지게차 및 하역장비, 차량간 충돌 및 적재 중량물 낙하위험"
    ],
    WING: [
        "1. 모든 화물차량은 사내 규정속도 15Km 이내로 서행 운행 (과속금지)",
        "2. 모든 화물차량은 지정된 장소에 정차 (시동 Off)",
        "3. 승/하차 시 반드시 손잡이를 잡고 천천히 타고 내린다 (슬리퍼 착용 금지)",
        "4. 지정 보행로 준수 및 창고 내 임의 출입을 절대 금지 (휴게시간 포함)<br>&nbsp;&nbsp;☞ 개인 보호구 착용 및 지정 흡연장소, 화장실 준수",
        "5. 운전석 승강 발판에 걸터 서서 부수적인 행동 절대 금지 (정리정돈 時 운전석 착석 후 실시)",
        "6. 상차 대기 時 운전석 내 휴식 및 수면 금지 (휴게실 및 대기실 이용 必)",
        "7. 상/하차 시 시동 OFF / 브레이크 체결",
        "8. 상차 전 준비(파렛트, 골판지) 작업 시 지상에서 작업을 실시<br>&nbsp;&nbsp;☞ 단, 적재함에 올라갈 경우 작업발판을 이용",
        "9. 상차 중 안전한 장소 (대기실, 운전석) 에서 대기, 지게차와 안전거리 확보",
        "10. 제품 소분 작업 (랩핑 작업) 은 지정된 장소 에서 실시",
        "11. 상차 후 필히 양개문/적재함을 닫고 출차",
        "12. *비상 상황 발생 시 (화재, 폭발) 안전한 장소로 신속히 대피"
    ],
    CARGO: [
        "1. 모든 화물차량은 사내 규정속도 15Km 이내로 서행 운행 (과속금지)",
        "2. 모든 화물차량은 지정된 장소에 정차 (시동 Off)",
        "3. 승/하차 시 반드시 손잡이를 잡고 천천히 타고 내린다 (슬리퍼 착용 금지)",
        "4. 지정 보행로 준수 및 창고 내 임의 출입을 절대 금지 (휴게시간 포함)<br>&nbsp;&nbsp;☞ 개인 보호구 착용 및 지정 흡연장소, 화장실 준수",
        "5. 운전석 승강 발판에 걸터 서서 부수적인 행동 절대 금지 (정리정돈 時 운전석 착석 후 실시)",
        "6. 상차 대기 時 운전석 내 휴식 및 수면 금지 (휴게실 및 대기실 이용 必)",
        "7. 상/하차 시 시동 OFF / 브레이크 체결",
        "8. 상차 전 준비(파렛트, 골판지, 천막 정리) 작업 시 지상에서 작업을 실시<br>&nbsp;&nbsp;☞ 단, 적재함에 올라갈 경우 작업발판을 이용",
        "9. 상차 중 안전한 장소 (대기실, 운전석) 에서 대기, 지게차와 안전거리 확보",
        "10. 제품 소분 작업 (랩핑 작업) 은 지정된 장소 에서 실시",
        "11. 복포작업 및 롤 굴림 작업은 추락방지시설 필히 이용 [헤드캐리어 이동 포함]<br>&nbsp;&nbsp;☞ 지상에서 안전모, 안전대 착용 및 안전고리 체결 후 작업",
        "12. *비상 상황 발생 시 (화재, 폭발) 안전한 장소로 신속히 대피"
    ],
    CONTAINER: [
        "1. 모든 컨테이너 차량은 사내 규정속도 15Km 이내로 서행운행 (과속금지)",
        "2. 사내 운행 시 무리한 회전이나 방향전환을 절대 금지한다.",
        "3. 모든 컨테이너 차량은 지정된 장소에 정차한다. (시동 Off)",
        "4. 컨테이너 개방 & 내부 청소 작업 시 작업발판을 이용한다.",
        "5. 운전석 승강 발판에 걸터 서서 부수적인 행동 절대 금지 (정리정돈 時 운전석 착석 후 실시)",
        "6. 지형지물, 지게차, 작업자 등을 확인 후 서행으로 도크에 진입한다. [고임목, 키회수]",
        "7. 하차 시 안전보호구를 반드시 착용하여야 하며 지정된 장소에서 대기한다. [배회금지]",
        "8. 하역 담당자의 출차 지시가 있을때까지 도크에서 출차를 금지한다.",
        "9. 컨테이너 도어잠금, 씰체결 작업 시 지정장소를 준수한다.",
        "10. *제품이 실린 컨테이너를 개방 할 경우, 단독 작업 금지 (검수 담당자 입회 요청)<br>&nbsp;&nbsp;☞ 도어 개방 시 제품의 낙하위험이 높으므로 측면에서 서서히 개방 (무리한 작업금지)",
        "11. *비상 상황 발생 시 (화재, 폭발) 안전한 장소로 신속히 대피한다."
    ],
    PENALTY: [
        "1차 : 경고장 발부 (기사 & 운송사)",
        "2차 : 차량기사 사유서 작성 (용차의 경우 소장 작성)",
        "3차 : 차량기사 배차 정지(7일) 및 소장 사유서 작성",
        "4차 : 영구 출입 금지"
    ]
};

const vehicleItemsData = {
    WING: [
        { name: "v_tire", code: "V-01", label: "타이어 상태" },
        { name: "v_steer", code: "V-02", label: "조향장치 상태" },
        { name: "v_lock", code: "V-03", label: "적재함 시건장치" },
        { name: "v_brake", code: "V-04", label: "제동장치 상태" },
        { name: "v_speed", code: "V-05", label: "속도제한장치 설치" },
        { name: "v_maint", code: "V-06", label: "차량 수시 경정비" },
        { name: "v_safety", code: "V-07", label: "운행 안전성" }
    ],
    CARGO: [
        { name: "v_tire", code: "V-01", label: "타이어 상태" },
        { name: "v_steer", code: "V-02", label: "조향장치 상태" },
        { name: "v_lock", code: "V-03", label: "적재함 시건장치" },
        { name: "v_brake", code: "V-04", label: "제동장치 상태" },
        { name: "v_speed", code: "V-05", label: "속도제한장치 설치" },
        { name: "v_maint", code: "V-06", label: "차량 수시 경정비" },
        { name: "v_safety", code: "V-07", label: "운행 안전성" }
    ],
    CONTAINER: [
        { name: "v_tire", code: "V-01", label: "타이어 상태" },
        { name: "v_steer", code: "V-02", label: "조향장치 상태" },
        { name: "v_chassis", code: "V-03", label: "샷시 결속 상태" },
        { name: "v_brake", code: "V-04", label: "제동장치 상태" },
        { name: "v_speed", code: "V-05", label: "속도제한장치 설치" },
        { name: "v_maint", code: "V-06", label: "차량 수시 경정비" },
        { name: "v_safety", code: "V-07", label: "운행 안전성" }
    ]
};

const cargoItemsData = {
    WING: [
        { name: "c_bal", code: "C-01", label: "화물의 적재 균형 상태" },
        { name: "c_over", code: "C-02", label: "화물의 초과하중 유무" },
        { name: "c_fix", code: "C-03", label: "화물의 고정 상태" },
        { name: "c_door", code: "C-04", label: "양개문/적재함 개폐기능" }
    ],
    CARGO: [
        { name: "c_bal", code: "C-01", label: "화물의 적재 균형 상태" },
        { name: "c_over", code: "C-02", label: "화물의 초과하중 유무" },
        { name: "c_fix", code: "C-03", label: "화물의 고정 상태" },
        { name: "c_door", code: "C-04", label: "적재함 개폐기능(평판 카고 제외)" }
    ],
    CONTAINER: [
        { name: "c_bal", code: "C-01", label: "화물의 적재 균형 상태" },
        { name: "c_over", code: "C-02", label: "화물의 초과하중 유무" },
        { name: "c_fix", code: "C-03", label: "화물의 고정(쇼링) 상태" },
        { name: "c_cone", code: "C-04", label: "콘 잠금장치 체결 기능" }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    // 모든 스텝 비활성화 후 Step 1 활성화 보장
    document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
    const step1 = document.getElementById('step1');
    if (step1) step1.classList.add('active');
    currentStep = 1;

    // 센터 배지 표시 변경
    const centerBadge = document.querySelector('.center-badge');
    if (centerBadge) {
        centerBadge.innerText = `[${centerName}] ${checkType === 'out' ? '- 적재 후 점검' : '- 입차 점검'}`;
    }

    // 적재 후 모드일 때 Step 4 하단 버튼을 '제출하기'로 교체
    if (checkType === 'out') {
        const step4Actions = document.querySelector('#step4 .bottom-actions');
        if (step4Actions) {
            step4Actions.innerHTML = `
                <button class="btn secondary" onclick="prevStep(1)">이전</button>
                <button class="btn primary submit" id="submitBtn" onclick="submitForm()">제출하기</button>
            `;
        }
    }

    updateStepIndicator(1);
});

// Navigation Methods
function nextStep(step) {
    if (!validateStep(currentStep)) return;
    
    let targetStep = step;

    if (checkType === 'in') {
        // 입차 모드: Step 3 완료 시 화물적재(Step 4) 건너뛰고 Step 5로 이동
        if (currentStep === 3) {
            targetStep = 5;
        }
    } else if (checkType === 'out') {
        // 적재후 모드: Step 1 완료 시 검사/상태 건너뛰고 바로 Step 4로 이동
        if (currentStep === 1) {
            targetStep = 4;
        }
    }
    
    if (targetStep >= 3 && targetStep <= 5) {
        renderDynamicItems();
    }
    
    goToStep(targetStep);
}

function prevStep(step) {
    let targetStep = step;

    if (checkType === 'in') {
        if (currentStep === 5) {
            targetStep = 3;
        }
    } else if (checkType === 'out') {
        if (currentStep === 4) {
            targetStep = 1;
        }
    }

    goToStep(targetStep);
}

function goToStep(step) {
    document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
    
    currentStep = step;
    const targetEl = document.getElementById(`step${currentStep}`);
    if (targetEl) targetEl.classList.add('active');
    
    updateStepIndicator(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStepIndicator(step) {
    if (!stepIndicator) return;

    if (checkType === 'out') {
        let stepNum = step === 1 ? 1 : 2;
        stepIndicator.innerText = `적재 후 점검 (${stepNum} / ${totalSteps})`;
    } else {
        let stepNum = step === 5 ? 4 : step;
        stepIndicator.innerText = `입차 점검 (${stepNum} / ${totalSteps})`;
    }
}

// Validation Methods (불량, 유소견, 아니요 차단 추가)
function validateStep(step) {
    if (step === 1) {
        const vno = document.getElementById('vehicleNo').value.trim();
        const vtype = document.querySelector('input[name="vehicleType"]:checked');
        
        if (!vno) {
            showToast("차량번호를 입력해주세요.");
            document.getElementById('vehicleNo').focus();
            return false;
        }
        if (!vtype) {
            showToast("차량 유형을 선택해주세요.");
            return false;
        }
        
        formData.vehicleNo = vno;
        formData.vehicleType = vtype.value;
        formData.carrierName = document.getElementById('carrierName').value.trim();
        formData.driverName = document.getElementById('driverName').value.trim();
        return true;
    }
    
    if (step === 2) {
        const comp = document.querySelector('input[name="insp_comprehensive"]:checked');
        const reg = document.querySelector('input[name="insp_regular"]:checked');
        
        if (!comp || !reg) {
            showToast("종합 검사 및 정기검사 성능결과를 모두 선택해주세요.");
            return false;
        }
        
        // 차단 조건: 불량 선택 시 진입 차단
        if (comp.value === '불량' || reg.value === '불량') {
            showToast("차량 검사 결과 '불량' 항목이 있어 다음 단계로 진행할 수 없습니다.");
            return false;
        }
        
        formData.insp_comprehensive = comp.value;
        formData.insp_regular = reg.value;
        return true;
    }
    
    if (step === 3) {
        // 건강상태 점검
        const healthMap = {
            'health_bp': '혈압(정상 : 80~120)',
            'health_cv': '심혈관계 질환',
            'health_etc': '기타 질환'
        };
        for (let [name, label] of Object.entries(healthMap)) {
            const selected = document.querySelector(`input[name="${name}"]:checked`);
            if (!selected) {
                showToast("모든 점검 항목을 선택해주세요.");
                return false;
            }
            if (selected.value === '유소견') {
                showToast(`건강상태(${label}) 항목에 '유소견'이 있어 입차를 진행할 수 없습니다.`);
                return false;
            }
        }

        // 차량 점검 항목 검증
        const currentVItems = vehicleItemsData[formData.vehicleType];
        for (let item of currentVItems) {
            const selected = document.querySelector(`input[name="${item.name}"]:checked`);
            if (!selected) {
                showToast("모든 점검 항목을 선택해주세요.");
                return false;
            }
            if (selected.value === '불량') {
                showToast(`차량 점검(${item.label}) 결과 '불량' 항목이 있어 진행할 수 없습니다.`);
                return false;
            }
        }
        return true;
    }
    
    if (step === 4) {
        const currentCItems = cargoItemsData[formData.vehicleType];
        for (let item of currentCItems) {
            const selected = document.querySelector(`input[name="${item.name}"]:checked`);
            if (!selected) {
                showToast("화물 적재 점검 항목을 모두 선택해주세요.");
                return false;
            }
            if (selected.value === '불량') {
                showToast(`화물 적재(${item.label}) 상태가 '불량'입니다. 재결박/적재 후 진행해 주세요.`);
                return false;
            }
        }
        return true;
    }

    return true;
}

function renderDynamicItems() {
    const type = formData.vehicleType || 'WING';
    if (vehicleTypeLabel) {
        vehicleTypeLabel.innerText = type === 'WING' ? '윙바디 (WING)' : (type === 'CARGO' ? '카고 (CARGO)' : '컨테이너 (CONTAINER)');
    }
    
    // Step 3 렌더링
    if (step3VehicleRender && step3VehicleRender.dataset.type !== type) {
        const vItems = vehicleItemsData[type];
        let vHtml = '';
        vItems.forEach(item => {
            vHtml += `
            <div class="form-group check-item">
                <label>${item.label} <span class="required">*</span></label>
                <div class="radio-card-group horizontal">
                    <label class="radio-card">
                        <input type="radio" name="${item.name}" data-code="${item.code}" value="양호">
                        <span class="card-content">양호</span>
                    </label>
                    <label class="radio-card warning">
                        <input type="radio" name="${item.name}" data-code="${item.code}" value="불량">
                        <span class="card-content">불량</span>
                    </label>
                </div>
            </div>
            `;
        });
        step3VehicleRender.innerHTML = vHtml;
        step3VehicleRender.dataset.type = type;
    }

    // Step 4 렌더링
    if (step4CargoRender && step4CargoRender.dataset.type !== type) {
        const cItems = cargoItemsData[type];
        let cHtml = '';
        cItems.forEach(item => {
            cHtml += `
            <div class="form-group check-item">
                <label>${item.label} <span class="required">*</span></label>
                <div class="radio-card-group horizontal">
                    <label class="radio-card">
                        <input type="radio" name="${item.name}" data-code="${item.code}" value="양호">
                        <span class="card-content">양호</span>
                    </label>
                    <label class="radio-card warning">
                        <input type="radio" name="${item.name}" data-code="${item.code}" value="불량">
                        <span class="card-content">불량</span>
                    </label>
                </div>
            </div>
            `;
        });
        step4CargoRender.innerHTML = cHtml;
        step4CargoRender.dataset.type = type;
    }

    // Step 5 수칙 렌더링
    if (step5RulesRender && step5RulesRender.dataset.type !== type) {
        let rHtml = `
            <div style="background:#fff3cd; border:1px solid #ffeeba; color:#856404; padding:15px; border-radius:8px; margin-bottom:15px; font-size:0.9em; line-height:1.6;">
                <strong>☞ 사업장 유해 위험 정보</strong><br>
                ${rulesData.COMMON_HAZARD.join('<br>')}
            </div>
            
            <div style="background:#ffffff; border:1px solid #ddd; padding:15px; border-radius:8px; font-size:0.9em; line-height:1.6; color:#000;">
                <strong style="color:#000;">☞ 차량기사 안전 준수사항</strong><br>
                ${rulesData[type].join('<br>')}
            </div>

            <div style="background:#f8d7da; border:1px solid #f5c6cb; color:#721c24; padding:15px; border-radius:8px; margin-top:15px; font-size:0.9em; line-height:1.6;">
                <strong>☞ 위반 시 조치사항 (패널티)</strong><br>
                ${rulesData.PENALTY.join(' / ')}
            </div>
        `;
        step5RulesRender.innerHTML = rHtml;
        step5RulesRender.dataset.type = type;
    }
}

function showToast(message) {
    toastEl.innerText = message;
    toastEl.classList.add('show');
    setTimeout(() => {
        toastEl.classList.remove('show');
    }, 3000);
}

// Submission
function submitForm() {
    // 입차 점검일 때만 Step 5의 최종 동의 검증
    if (checkType === 'in') {
        const consent = document.querySelector('input[name="final_consent"]:checked');
        if (!consent) {
            showToast("최종 동의 여부를 선택해주세요.");
            return;
        }
        if (consent.value === '아니요') {
            showToast("안전 준수사항에 동의하지 않으시면 입차 점검을 완료할 수 없습니다.");
            return;
        }
        formData.finalConsent = consent.value;
    } else {
        // 적재 후 점검일 때는 Step 4 검증 수행
        if (!validateStep(4)) return;
        formData.finalConsent = "해당없음(적재후)";
    }
    
    const allItems = [];
    
    if (checkType === 'in') {
        document.querySelectorAll('#step3 input[type="radio"]:checked').forEach(el => {
            allItems.push({
                itemCode: el.getAttribute('data-code'),
                value: el.value
            });
        });
    }
    
    if (checkType === 'out') {
        document.querySelectorAll('#step4 input[type="radio"]:checked').forEach(el => {
            allItems.push({
                itemCode: el.getAttribute('data-code'),
                value: el.value
            });
        });
    }
    
    formData.items = allItems;
    console.log("제출할 데이터:", JSON.stringify(formData, null, 2));
    
    loadingOverlay.classList.remove('hidden');
    
    fetch('https://desktop-g3rnt5i.tail25a848.ts.net/webhook-test/a7c22a42-15cd-4b1f-9020-465c437c6181', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        loadingOverlay.classList.add('hidden');
        if (response.ok) {
            showCompletionScreen();
        } else {
            showToast("데이터 전송 중 오류가 발생했습니다. 다시 시도해주세요.");
        }
    })
    .catch(error => {
        loadingOverlay.classList.add('hidden');
        console.error('Webhook Error:', error);
        showToast("네트워크 오류가 발생했습니다. 연결을 확인해주세요.");
    });
}

function showCompletionScreen() {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const receiptNo = `${dateStr}-${randomNum}`;
    
    document.getElementById('receiptNo').innerText = receiptNo;
    
    // 현재 열려있는 스텝(Step 4 또는 Step 5) 닫기
    document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
    document.getElementById('stepComplete').classList.add('active');
    document.querySelector('.app-header').style.display = 'none';
}
