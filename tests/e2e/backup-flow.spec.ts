import { expect, test } from '@playwright/test';
const makeFixture = () => {
  const date=new Date().toISOString();
  const channel=(id:string,title:string)=>({id,title,description:'',thumbnail:'',subscriberCount:1000,viewCount:8000,videoCount:2,uploadsId:'uploads',topics:[],fetchedAt:date});
  const video=(id:string,channelId:string)=>({id,channelId,title:`Video ${id}`,description:'',thumbnail:'',publishedAt:date,durationSeconds:360,categoryId:'28',viewCount:1000,likeCount:4,commentCount:2,fetchedAt:date});
  return {app:'youtube-radar',schemaVersion:'1.0.0',exportedAt:date,data:{
    channels:[channel('qa_base','[QA] Base'),channel('qa_other','[QA] Competitor')],
    videos:[video('qa_vid1','qa_base'),video('qa_vid2','qa_other')],
    snapshots:[],owners:[{channelId:'qa_base',isPrimary:true,addedAt:date}],
    competitors:[{id:'qa_base:qa_other',ownerId:'qa_base',channelId:'qa_other',addedAt:date,role:'direct'}],settings:[],
  }};
};
test('JSON 복원, 기준/경쟁 목록, 새로고침 보존, 삭제',async({page})=>{
  await page.goto('/settings');
  const selectFile=page.getByRole('button',{name:'JSON 파일 선택'});
  const picker=page.waitForEvent('filechooser');
  await selectFile.click();
  await (await picker).setFiles({name:'qa-sample.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(makeFixture()))});
  await expect(page.getByText(/가져오기 완료:/)).toBeVisible();
  await page.goto('/discover');
  await expect(page.getByText('[QA] Competitor').first()).toBeVisible();
  await page.reload();
  await expect(page.getByText('[QA] Competitor').first()).toBeVisible();
  page.once('dialog', dialog=>dialog.accept());
  await page.getByRole('button',{name:'[QA] Competitor 저장 데이터 완전 삭제'}).click();
  await expect(page.locator('.discover-linked-row').filter({hasText:'[QA] Competitor'})).toHaveCount(0);
  await page.goto('/library');
  await expect(page.getByText('[QA] Base').first()).toBeVisible();
});
test('사용 설명서와 메타데이터',async({page})=>{
  await page.goto('/user-guide');
  await expect(page.getByRole('heading',{name:/사용/}).first()).toBeVisible();
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content',/\/og-image\.png$/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content','summary_large_image');
});
