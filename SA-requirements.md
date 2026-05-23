# ĐỀ TÀI TIỂU LUẬN  
## THIẾT KẾ KIẾN TRÚC PHẦN MỀM

---

# 1. Mô tả chung

Sinh viên sẽ tự chọn một lĩnh vực ứng dụng (domain) và phát triển một hệ thống phần mềm hoàn chỉnh, từ việc phân tích yêu cầu, lựa chọn kiến trúc đến triển khai (implementation).

Mục tiêu là áp dụng các khái niệm trong sách:

> *Fundamentals of Software Architecture – Mark Richards & Neal Ford*

---

# 2. Yêu cầu bài làm

## 2.1. Yêu cầu tổng quát

Sinh viên (cá nhân hoặc nhóm tối đa 3 người) cần:

- Chọn một hệ thống phần mềm cụ thể (ví dụ):
  - Thương mại điện tử (e-commerce)
  - Hệ thống quản lý bệnh viện
  - Ứng dụng học trực tuyến
  - Hệ thống đặt vé (booking)
  - Mạng xã hội mini
  - ...

- Thực hiện các bước:
  1. Phân tích yêu cầu
  2. Xác định kiến trúc
  3. Thiết kế chi tiết
  4. Triển khai một phần hệ thống

---

## 2.2. Yêu cầu chi tiết

### 🔹 (1) Phân tích hệ thống

- Mô tả bài toán và phạm vi
- Stakeholders
- Functional requirements
- Non-functional requirements (theo kiến thức trong sách):
  - Scalability
  - Performance
  - Availability
  - Security
  - Maintainability

---

### 🔹 (2) Lựa chọn kiến trúc

Sinh viên phải:

- Chọn một hoặc nhiều architecture style:
  - Layered Architecture
  - Microservices Architecture
  - Event-driven Architecture
  - Services-based Architecture
  - Space-based Architecture
  - Microkernel Architecture
  - Pipeline Architecture
  - Orchestration Driven Architecture

- Giải thích:
  - Tại sao chọn kiến trúc này
  - Trade-offs (**rất quan trọng**)
  - So sánh với phương án khác

---

### 🔹 (3) Thiết kế kiến trúc

Bao gồm:

- Architecture diagram (UML hoặc C4 model — khuyến khích dùng)
- Component diagram
- Data flow diagram
- Service decomposition (nếu có)
- API design (REST/gRPC,…)

---

### 🔹 (4) Áp dụng kỹ thuật kiến trúc

Áp dụng các khái niệm từ sách:

- Architectural characteristics analysis
- Coupling & cohesion
- Modularity
- Domain partitioning
- Distributed system patterns (nếu có)
- Data consistency strategy

---

### 🔹 (5) Triển khai (Implementation)

- Cài đặt tối thiểu một phần quan trọng của hệ thống
- Có thể chọn (tùy theo kiến trúc):
  - Backend APIs
  - Một số microservices
  - Prototype hệ thống
  - ...

- Công nghệ tự chọn:
  - Java
  - .NET
  - Node.js
  - Python
  - ...

---

### 🔹 (6) Đánh giá & Trade-off

- Đánh giá:
  - Điểm mạnh và yếu của kiến trúc
  - Các rủi ro kiến trúc

- Nêu rõ:
  - Kiến trúc có thể thay đổi như thế nào khi scale

---

# 3. Đề cương bài báo cáo (Report Outline)

> Format: **15 – 35 trang**

## 1. Introduction

- Giới thiệu hệ thống
- Mục tiêu

## 2. System Requirements

- Business context
- Functional & non-functional requirements

## 3. Architecture Selection

- Các lựa chọn kiến trúc
- Phân tích trade-off
- Quyết định cuối cùng

## 4. Architecture Design

- Tổng quan kiến trúc
- Diagram (C4, logical, deployment…)
- Mô tả chi tiết các thành phần

## 5. Technical Design

- API
- Data model
- Integration

## 6. Implementation

- Các phần đã cài đặt
- Công nghệ sử dụng
- Demo (nếu có)

## 7. Evaluation

- Đánh giá kiến trúc
- Quality attributes

## 8. Conclusion

- Tổng kết
- Hướng phát triển

---

# 4. Rubrics đánh giá (100 điểm)

| Tiêu chí | Mô tả | Điểm |
|---|---|---|
| 1. Phân tích yêu cầu | Rõ ràng, đầy đủ functional & non-functional requirements | 15 |
| 2. Lựa chọn kiến trúc | Phù hợp, có giải thích và trade-off đúng theo lý thuyết | 15 |
| 3. Thiết kế kiến trúc | Sơ đồ rõ ràng, hợp lý, có tính thực tiễn | 20 |
| 4. Áp dụng kiến thức từ sách | Sử dụng đúng concepts (modularity, coupling, scalability...) | 15 |
| 5. Implementation | Có code, triển khai hợp lý, chạy được | 10 |
| 6. Đánh giá & trade-offs | Phân tích sâu, hiểu rõ kiến trúc | 10 |
| 7. Báo cáo & trình bày | Viết rõ ràng, logic, trình bày đẹp | 10 |
| 8. Sáng tạo & mở rộng | Ý tưởng mới, cải tiến, mở rộng | 5 |

---

# 5. Bonus (tối đa +10 điểm)

- +3: Sử dụng cloud (AWS, Azure, GCP)
- +3: Áp dụng CI/CD
- +2: Có monitoring/logging
- +2: Triển khai distributed system thực tế

---

# 6. Tiêu chí đạt/không đạt

## ✅ Đạt

- Có kiến trúc rõ ràng
- Có phân tích trade-offs
- Có implementation

## ❌ Không đạt

- Chỉ mô tả lý thuyết, không có hệ thống cụ thể
- Không có kiến trúc rõ ràng
- Không triển khai gì

---

# 7. Gợi ý đề tài

- Hệ thống đặt xe (Grab-like)
- Hệ thống học online
- E-commerce microservices
- Chat application
- Food delivery system
- ...

---

# 8. Nộp bài

- Báo cáo PDF
- Source code (GitHub)
- (Optional) Video demo