export const uploadToImgBB = async (file: File): Promise<string> => {
  try {
    // Convert file to base64
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const base64String = reader.result as string;
          const response = await fetch("/api/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              image: base64String.split(",")[1], // Remove data:image/xxx;base64, prefix
            }),
          });

          if (!response.ok) {
            reject(new Error("Yükleme başarısız"));
            return;
          }

          const data = await response.json();
          if (data.success) {
            resolve(data.url);
          } else {
            reject(new Error(data.error || "Yükleme başarısız"));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error("Dosya okunamadı"));
      };
      
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error("ImgBB upload error:", error);
    throw error;
  }
};
