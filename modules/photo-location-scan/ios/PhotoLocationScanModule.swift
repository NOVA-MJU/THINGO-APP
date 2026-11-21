import ExpoModulesCore
import Photos
import Vision

// 사진첩 전체에서 좌표 범위 안에서 찍힌 사진만 골라준다.
// expo-media-library는 사진마다 위치를 따로 물어봐야 해서 수만 장이면 너무 느리다.
// 여기서는 PHAsset 목록을 한 번 훑으면서 이미 들어 있는 위치 값만 비교한다 (원본 파일은 열지 않음)
public class PhotoLocationScanModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PhotoLocationScan")

    AsyncFunction("findPhotosInBounds") { (minLatitude: Double, maxLatitude: Double, minLongitude: Double, maxLongitude: Double) -> [[String: Any]] in
      let options = PHFetchOptions()
      options.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: false)]
      let assets = PHAsset.fetchAssets(with: .image, options: options)

      var photos: [[String: Any]] = []
      assets.enumerateObjects { asset, _, _ in
        guard let coordinate = asset.location?.coordinate, let takenAt = asset.creationDate,
              coordinate.latitude >= minLatitude, coordinate.latitude <= maxLatitude,
              coordinate.longitude >= minLongitude, coordinate.longitude <= maxLongitude
        else { return }
        photos.append([
          "id": asset.localIdentifier,
          "takenAt": takenAt.timeIntervalSince1970 * 1000,
          "latitude": coordinate.latitude,
          "longitude": coordinate.longitude,
          "width": asset.pixelWidth,
          "height": asset.pixelHeight,
        ])
      }
      return photos
    }

    // 사진마다 무엇이 찍혔는지 기기 안에서 분류한다 (Apple Vision, 서버로 보내지 않음).
    // 확신도 0.3 이상인 라벨(food, coffee, beer, ramen...)만 돌려주고, 음식인지·어떤 가게인지는 JS에서 판단한다.
    // 썸네일 크기로만 읽고 iCloud에서 내려받지 않는다. 기기에 이미지가 없어 분류하지 못한 사진은 결과에서 빠진다
    AsyncFunction("classifyPhotos") { (ids: [String]) -> [String: [String]] in
      let assets = PHAsset.fetchAssets(withLocalIdentifiers: ids, options: nil)
      let options = PHImageRequestOptions()
      options.isSynchronous = true
      options.deliveryMode = .highQualityFormat
      options.resizeMode = .fast
      options.isNetworkAccessAllowed = false

      var labelsById: [String: [String]] = [:]
      assets.enumerateObjects { asset, _, _ in
        var cgImage: CGImage?
        PHImageManager.default().requestImage(
          for: asset, targetSize: CGSize(width: 360, height: 360), contentMode: .aspectFill, options: options
        ) { image, _ in
          cgImage = image?.cgImage
        }
        guard let cgImage else { return }
        let request = VNClassifyImageRequest()
        do {
          try VNImageRequestHandler(cgImage: cgImage, options: [:]).perform([request])
        } catch {
          return
        }
        labelsById[asset.localIdentifier] = (request.results ?? [])
          .filter { $0.confidence >= 0.3 }
          .map { $0.identifier }
      }
      return labelsById
    }
  }
}
