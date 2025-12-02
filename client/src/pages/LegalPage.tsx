import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getLegalPage } from "@/lib/firebase";
import type { LegalPage as LegalPageType } from "@shared/schema";

const defaultContent: Record<string, { title: string; content: string }> = {
  "gizlilik-politikasi": {
    title: "Gizlilik Politikası",
    content: `
## Gizlilik Politikası

ABKHomeDesign olarak, müşterilerimizin gizliliğine büyük önem veriyoruz. Bu gizlilik politikası, kişisel verilerinizin nasıl toplandığını, kullanıldığını ve korunduğunu açıklamaktadır.

### Toplanan Bilgiler

Sitemizi kullandığınızda aşağıdaki bilgileri toplayabiliriz:
- Ad, soyad ve iletişim bilgileri
- Teslimat ve fatura adresleri
- Ödeme bilgileri (güvenli ödeme ortağımız aracılığıyla)
- Sipariş geçmişi ve tercihler

### Bilgilerin Kullanımı

Topladığımız bilgileri şu amaçlarla kullanıyoruz:
- Siparişlerinizi işlemek ve teslim etmek
- Müşteri hizmetleri sağlamak
- Yasal yükümlülüklerimizi yerine getirmek
- Hizmetlerimizi geliştirmek

### Bilgi Güvenliği

Kişisel verileriniz, 256-bit SSL şifreleme ile korunmaktadır. Bilgilerinizi yetkisiz erişime karşı korumak için gerekli tüm teknik ve idari önlemleri alıyoruz.

### İletişim

Gizlilik politikamız hakkında sorularınız için info@abkhomedesign.com adresinden bizimle iletişime geçebilirsiniz.
    `,
  },
  "kullanim-kosullari": {
    title: "Kullanım Koşulları",
    content: `
## Kullanım Koşulları

ABKHomeDesign web sitesini kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız.

### Genel Koşullar

1. Bu web sitesi ABKHomeDesign tarafından işletilmektedir.
2. Siteyi kullanarak 18 yaşından büyük olduğunuzu beyan edersiniz.
3. Site üzerindeki tüm içerikler telif hakkı ile korunmaktadır.

### Sipariş ve Ödeme

- Tüm fiyatlar TL cinsindendir ve KDV dahildir.
- Ödeme işlemleri güvenli ödeme altyapımız üzerinden gerçekleştirilir.
- Siparişiniz ödeme onayından sonra işleme alınır.

### Teslimat

- Standart teslimat süresi 3-5 iş günüdür.
- 500 TL üzeri siparişlerde kargo ücretsizdir.
- Teslimat adresi doğru ve eksiksiz girilmelidir.

### İade ve Değişim

- 14 gün içinde ücretsiz iade hakkınız bulunmaktadır.
- İade edilecek ürünler kullanılmamış ve orijinal ambalajında olmalıdır.
- İade işlemleri için müşteri hizmetlerimizle iletişime geçin.
    `,
  },
  kvkk: {
    title: "KVKK Aydınlatma Metni",
    content: `
## Kişisel Verilerin Korunması Kanunu (KVKK) Aydınlatma Metni

6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında, veri sorumlusu sıfatıyla ABKHomeDesign olarak kişisel verilerinizin işlenmesine ilişkin aşağıdaki hususları bilginize sunuyoruz.

### Kişisel Verilerin İşlenme Amaçları

Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
- Ürün ve hizmetlerin sunulması
- Sipariş ve ödeme işlemlerinin yürütülmesi
- Müşteri ilişkileri yönetimi
- Yasal yükümlülüklerin yerine getirilmesi

### Kişisel Verilerin Aktarılması

Kişisel verileriniz, hizmet sağlayıcılarımız (kargo şirketleri, ödeme kuruluşları) ve yasal merciler ile paylaşılabilir.

### Haklarınız

KVKK kapsamında aşağıdaki haklara sahipsiniz:
- Kişisel verilerinizin işlenip işlenmediğini öğrenme
- İşleme amacını öğrenme
- Düzeltme talep etme
- Silme veya yok edilmesini talep etme
- İtiraz etme

### Başvuru

Haklarınızı kullanmak için kvkk@abkhomedesign.com adresine yazılı başvuru yapabilirsiniz.
    `,
  },
  "iade-politikasi": {
    title: "İade Politikası",
    content: `
## İade ve Değişim Politikası

ABKHomeDesign olarak müşteri memnuniyetini ön planda tutuyoruz. Aşağıda iade ve değişim koşullarımızı bulabilirsiniz.

### İade Koşulları

- Tüm ürünlerde 14 gün içinde ücretsiz iade hakkı
- Ürünler kullanılmamış ve orijinal ambalajında olmalıdır
- Etiketler çıkarılmamış olmalıdır

### İade Süreci

1. Müşteri hizmetlerimizle iletişime geçin
2. İade formunu doldurun
3. Ürünü orijinal ambalajında paketleyin
4. Kargo ile gönderin (ücretsiz kargo etiketi sağlanır)

### İade Süresi

- İade talebiniz 24 saat içinde değerlendirilir
- Onay sonrası ürünü 3 gün içinde kargoya verin
- Ürün bize ulaştıktan sonra 5-7 iş günü içinde iade işlemi tamamlanır

### Para İadesi

- İade tutarı, ödeme yönteminize göre iade edilir
- Kredi kartı ödemelerinde 5-10 iş günü sürebilir

### Değişim

- Farklı beden veya renk için değişim yapılabilir
- Değişim işlemi ücretsizdir
    `,
  },
  "kargo-politikasi": {
    title: "Kargo ve Teslimat",
    content: `
## Kargo ve Teslimat Politikası

### Teslimat Süreleri

- Standart teslimat: 3-5 iş günü
- Hızlı teslimat: 1-2 iş günü (ek ücretli)

### Kargo Ücreti

- 500 TL üzeri siparişlerde ücretsiz kargo
- 500 TL altı siparişlerde 29,90 TL kargo ücreti

### Teslimat Bölgeleri

Türkiye'nin tüm illerine teslimat yapılmaktadır.

### Kargo Takibi

Siparişiniz kargoya verildiğinde, takip numarası e-posta ile gönderilir.

### Teslimat Sorunları

Teslimat ile ilgili sorunlar için müşteri hizmetlerimizle iletişime geçebilirsiniz.
    `,
  },
};

export default function LegalPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const params = useParams();
  const slug = params.slug as string;
  const [page, setPage] = useState<LegalPageType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPage = async () => {
      try {
        const pageData = await getLegalPage(slug);
        setPage(pageData);
      } catch (error) {
        console.error("Error loading page:", error);
      } finally {
        setLoading(false);
      }
    };
    loadPage();
  }, [slug]);

  const defaultPage = defaultContent[slug];
  const title = page?.title || defaultPage?.title || "Sayfa";
  const content = page?.content || defaultPage?.content || "İçerik bulunamadı.";

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-64 mb-6" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">{title}</h1>
      <Card>
        <CardContent className="p-6 md:p-8">
          <div 
            className="prose prose-sm md:prose-base max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br>').replace(/##\s/g, '<h2>').replace(/###\s/g, '<h3>') }}
          />
          {page?.lastUpdated && (
            <p className="text-sm text-muted-foreground mt-8 pt-4 border-t">
              Son güncelleme: {new Date(page.lastUpdated).toLocaleDateString("tr-TR")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
