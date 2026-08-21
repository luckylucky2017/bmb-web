const products = [
  {
    slug: "lavie-nuoc-khoang-thien-nhien-500ml",
    name: "La Vie Nước khoáng thiên nhiên 500ml",
    category: "Nước khoáng thiên nhiên",
    volume: "500ml",
    price: "101,000₫",
    image: "/images/products/product-500.svg",
    color: "#2193e8",
    shortDescription: "Nước khoáng thiên nhiên La Vie, giàu khoáng chất, tiện lợi mang theo mỗi ngày.",
    description:
      "La Vie Nước khoáng thiên nhiên 500ml được khai thác từ mạch nước ngầm tự nhiên, giữ nguyên vẹn các khoáng chất như Canxi, Magie, Kali. BMB Việt Nam là đại lý phân phối chính thức, cam kết 100% hàng chính hãng, giao nhanh trong khu vực Hà Nội.",
    highlights: [
      "Hàng chính hãng La Vie 100%, có tem đại lý BMB Việt Nam",
      "Giàu khoáng chất: Canxi, Magie, Kali, Natri",
      "Chai PET tái chế được, thiết kế nhỏ gọn",
      "Đạt chuẩn QCVN 6-1:2010/BYT"
    ]
  },
  {
    slug: "lavie-nuoc-khoang-thien-nhien-1500ml",
    name: "La Vie Nước khoáng thiên nhiên 1.5L",
    category: "Nước khoáng thiên nhiên",
    volume: "1.5L",
    price: "115,000₫",
    image: "/images/products/product-1500.svg",
    color: "#1476c7",
    shortDescription: "Dung tích lớn, lựa chọn lý tưởng cho gia đình và văn phòng tại Hà Nội.",
    description:
      "Chai 1.5L chính hãng La Vie, phù hợp cho bữa ăn gia đình, cuộc họp văn phòng hoặc dự trữ hàng ngày. BMB Việt Nam giao hàng tận nơi trong nội và ngoại thành Hà Nội, đặt hàng nhanh qua hotline.",
    highlights: [
      "Dung tích lớn, tiết kiệm cho gia đình và văn phòng",
      "Giữ nguyên khoáng chất tự nhiên từ La Vie",
      "Giao hàng tận nơi trong ngày tại nội thành Hà Nội",
      "Đạt chuẩn QCVN 6-1:2010/BYT"
    ]
  },
  {
    slug: "lavie-nuoc-tinh-khiet-350ml",
    name: "La Vie Nước tinh khiết 350ml",
    category: "Nước tinh khiết",
    volume: "350ml",
    price: "91,000₫",
    image: "/images/products/product-350.svg",
    color: "#2cc3c9",
    shortDescription: "Nước tinh khiết La Vie, lọc qua công nghệ RO 7 lớp, an toàn cho cả gia đình.",
    description:
      "Sản xuất trên dây chuyền lọc RO (thẩm thấu ngược) 7 lớp hiện đại của La Vie, loại bỏ tạp chất và vi khuẩn. BMB Việt Nam phân phối chính thức tại Hà Nội, đảm bảo nguồn hàng chính hãng, hạn sử dụng mới.",
    highlights: [
      "Công nghệ lọc RO 7 lớp hiện đại từ nhà máy La Vie",
      "An toàn cho trẻ nhỏ và người lớn tuổi",
      "Không màu, không mùi, vị thanh khiết",
      "BMB Việt Nam kiểm tra hạn sử dụng trước khi giao"
    ]
  },
  {
    slug: "lavie-binh-nuoc-19l",
    name: "La Vie Bình nước 19L (có vòi)",
    category: "Bình nước gia đình & văn phòng",
    volume: "19L",
    price: "67,000₫",
    image: "/images/products/product-19l.svg",
    color: "#15426e",
    shortDescription: "Giải pháp nước uống dài ngày cho gia đình, văn phòng, trường học tại Hà Nội.",
    description:
      "Bình 19L La Vie chính hãng, dùng cùng cây nước nóng lạnh, đáp ứng nhu cầu uống nước hàng ngày. BMB Việt Nam là đại lý cấp 1 khu vực Hà Nội, giao hàng và đổi vỏ bình miễn phí trong ngày.",
    highlights: [
      "Bình nước La Vie chính hãng, có tem đại lý BMB",
      "Giao hàng tận nơi, đổi bình nhanh chóng trong ngày",
      "Nhận đặt định kỳ hàng tuần/hàng tháng cho văn phòng",
      "Thu hồi vỏ bình cũ, bảo vệ môi trường"
    ]
  },
  {
    slug: "lavie-nuoc-khoang-co-ga-330ml",
    name: "La Vie Nước khoáng có gas 330ml",
    category: "Nước khoáng có gas",
    volume: "330ml",
    price: "145,000₫",
    image: "/images/products/product-gas.svg",
    color: "#39905a",
    shortDescription: "Vị sảng khoái với bọt gas tự nhiên từ La Vie, làm mới ngày dài năng động.",
    description:
      "Kết hợp nước khoáng thiên nhiên La Vie cùng bọt gas mịn, mang lại cảm giác sảng khoái tức thì. BMB Việt Nam nhập hàng trực tiếp, đảm bảo chất lượng nguyên vẹn khi đến tay khách hàng tại Hà Nội.",
    highlights: [
      "Bọt gas tự nhiên, mịn và sảng khoái",
      "Giữ khoáng chất tự nhiên từ nguồn nước La Vie",
      "Phù hợp giải khát hoặc pha chế thức uống",
      "Chai thủy tinh cao cấp, thân thiện môi trường"
    ]
  },
  {
    slug: "lavie-nuoc-tinh-khiet-500ml-the-thao",
    name: "La Vie Nước tinh khiết 500ml (nắp thể thao)",
    category: "Nước tinh khiết",
    volume: "500ml",
    price: "108,000₫",
    image: "/images/products/product-sport.svg",
    color: "#49b1f6",
    shortDescription: "Thiết kế nắp bật tiện lợi cho vận động, thể thao, dã ngoại.",
    description:
      "Với thiết kế nắp bật (sport cap) tiện lợi, sản phẩm La Vie là người bạn đồng hành lý tưởng khi tập luyện, chạy bộ hoặc dã ngoại. BMB Việt Nam cung cấp sỉ và lẻ, giao hàng nhanh trong khu vực Hà Nội.",
    highlights: [
      "Nắp bật tiện lợi, uống nhanh khi vận động",
      "Trọng lượng nhẹ, dễ mang theo",
      "Nước tinh khiết La Vie đạt chuẩn an toàn thực phẩm",
      "Nhận đặt sỉ cho phòng gym, sự kiện thể thao"
    ]
  }
];

module.exports = { products };
