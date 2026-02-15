import { uploadFile } from "@/lib/upload"

// Mock global fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe("uploadFile", () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it("uploads a file and returns the public URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ publicUrl: "https://storage.example.com/file.png" }),
    })

    const file = new File(["data"], "test.png", { type: "image/png" })
    const url = await uploadFile(file)

    expect(url).toBe("https://storage.example.com/file.png")
    expect(mockFetch).toHaveBeenCalledWith("/api/storage/upload", {
      method: "POST",
      body: expect.any(FormData),
    })

    // Verify form data contents
    const formData = mockFetch.mock.calls[0][1].body as FormData
    expect(formData.get("file")).toBe(file)
    expect(formData.get("bucket")).toBe("organization-assets")
  })

  it("sends custom bucket and folder options", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ publicUrl: "https://storage.example.com/logos/logo.png" }),
    })

    const file = new File(["data"], "logo.png", { type: "image/png" })
    await uploadFile(file, { bucket: "organization-assets", folder: "logos" })

    const formData = mockFetch.mock.calls[0][1].body as FormData
    expect(formData.get("bucket")).toBe("organization-assets")
    expect(formData.get("folder")).toBe("logos")
  })

  it("throws on upload failure with error message from API", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: "Only image files are allowed" }),
    })

    const file = new File(["data"], "test.pdf", { type: "application/pdf" })

    await expect(uploadFile(file)).rejects.toThrow("Only image files are allowed")
  })

  it("throws with status code when API returns no JSON", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => { throw new Error("no json") },
    })

    const file = new File(["data"], "test.png", { type: "image/png" })

    await expect(uploadFile(file)).rejects.toThrow("Upload failed: 500")
  })
})
